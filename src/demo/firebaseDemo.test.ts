/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CHAVE, carregarShim } from "./carregarShim";

const w = window as any;

function iniciar(seed?: Record<string, Record<string, unknown>>, opcoes?: { limpar?: boolean }) {
  w.criarSeedDemo = seed ? () => JSON.parse(JSON.stringify(seed)) : undefined;
  const { firebase, demoStore } = carregarShim(opcoes);
  firebase.initializeApp(w.FIREBASE_CONFIG);
  return { firebase, demoStore, db: firebase.firestore(), auth: firebase.auth() };
}

const tick = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

beforeEach(() => {
  delete w.criarSeedDemo;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("firestore falso", () => {
  test("semente na primeira carga", async () => {
    const { db } = iniciar({ itens: { a: { nome: "Caneta" } } });
    const s = await db.collection("itens").get();
    expect(s.size).toBe(1);
    expect(s.docs[0].id).toBe("a");
    expect(s.docs[0].data()).toEqual({ nome: "Caneta" });
  });

  test("add, get, update com ponto, delete", async () => {
    const { db } = iniciar();
    const ref = await db.collection("itens").add({ nome: "Boné", x: { y: 1, z: 1 } });
    expect(ref.id).toBeTruthy();
    await ref.update({ "x.y": 2 });
    const d = await ref.get();
    expect(d.exists).toBe(true);
    expect(d.data().x).toEqual({ y: 2, z: 1 });
    await ref.delete();
    const apagado = await db.collection("itens").doc(ref.id).get();
    expect(apagado.exists).toBe(false);
    expect(apagado.data()).toBeUndefined();
  });

  test("update em documento inexistente rejeita", async () => {
    const { db } = iniciar();
    await expect(db.doc("itens/nao-existe").update({ a: 1 })).rejects.toBeTruthy();
  });

  test("set com merge mantém campos", async () => {
    const { db } = iniciar({ config: { remetente: { nome: "A", cidade: "B" } } });
    await db.doc("config/remetente").set({ nome: "C" }, { merge: true });
    expect((await db.doc("config/remetente").get()).data()).toEqual({ nome: "C", cidade: "B" });
    await db.doc("config/remetente").set({ nome: "D" });
    expect((await db.doc("config/remetente").get()).data()).toEqual({ nome: "D" });
  });

  test("where, orderBy e limit", async () => {
    const { db } = iniciar({ n: { a: { v: 1 }, b: { v: 3 }, c: { v: 2 } } });
    const s = await db.collection("n").where("v", ">", 1).orderBy("v", "desc").limit(1).get();
    expect(s.docs.map((d: any) => d.id)).toEqual(["b"]);
  });

  test("array-contains, arrayUnion e arrayRemove", async () => {
    const { db, firebase } = iniciar({ conversas: { a: { membros: ["x"] }, b: { membros: ["y"] } } });
    const FV = firebase.firestore.FieldValue;
    await db.doc("conversas/b").update({ membros: FV.arrayUnion("x", "y") });
    const s = await db.collection("conversas").where("membros", "array-contains", "x").get();
    expect(s.docs.map((d: any) => d.id).sort()).toEqual(["a", "b"]);
    await db.doc("conversas/b").update({ membros: FV.arrayRemove("y") });
    expect((await db.doc("conversas/b").get()).data().membros).toEqual(["x"]);
  });

  test("subcoleção pedidos/{id}/respostas", async () => {
    const { db } = iniciar({ pedidos: { p1: { texto: "oi" } } });
    await db.collection("pedidos").doc("p1").collection("respostas").add({ texto: "resp" });
    const s = await db.collection("pedidos").doc("p1").collection("respostas").get();
    expect(s.size).toBe(1);
    expect((await db.collection("pedidos").get()).size).toBe(1);
  });

  test("onSnapshot dispara na hora e a cada escrita; unsubscribe para", async () => {
    const { db } = iniciar({ itens: { a: { n: 1 } } });
    const tamanhos: number[] = [];
    const parar = db.collection("itens").onSnapshot((s: any) => tamanhos.push(s.size));
    await Promise.resolve();
    await db.collection("itens").add({ n: 2 });
    await tick();
    parar();
    await db.collection("itens").add({ n: 3 });
    expect(tamanhos).toEqual([1, 2]);
  });

  test("onSnapshot de documento", async () => {
    const { db } = iniciar();
    const vistos: boolean[] = [];
    db.doc("config/remetente").onSnapshot((s: any) => vistos.push(s.exists));
    await Promise.resolve();
    await db.doc("config/remetente").set({ nome: "A" });
    await tick();
    expect(vistos).toEqual([false, true]);
  });

  test("ouvinte que grava o mesmo dado não entra em loop", async () => {
    const { db } = iniciar({ conversas: {} });
    let chamadas = 0;
    db.collection("conversas").onSnapshot(() => {
      chamadas++;
      if (chamadas > 50) throw new Error("loop");
      db.doc("conversas/equipe").set({ nome: "Equipe" }, { merge: true });
    });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(chamadas).toBeLessThanOrEqual(3);
  });

  test("não avisa de novo quando nada mudou", async () => {
    const { db } = iniciar({ itens: { a: { n: 1 } } });
    const vistos: number[] = [];
    db.collection("itens").onSnapshot((s: any) => vistos.push(s.size));
    await tick();
    await db.doc("outros/x").set({ y: 1 });
    await tick();
    expect(vistos).toEqual([1]);
  });

  test("batch aplica tudo no commit", async () => {
    const { db } = iniciar({ itens: { a: { n: 1 }, b: { n: 1 } } });
    const b = db.batch();
    b.update(db.doc("itens/a"), { n: 5 });
    b.delete(db.doc("itens/b"));
    b.set(db.collection("itens").doc("c"), { n: 9 });
    expect((await db.collection("itens").get()).size).toBe(2);
    await b.commit();
    const s = await db.collection("itens").get();
    expect(Object.fromEntries(s.docs.map((d: any) => [d.id, d.data().n]))).toEqual({ a: 5, c: 9 });
  });

  test("runTransaction lê e escreve", async () => {
    const { db } = iniciar({ itens: { a: {} } });
    const ref = db.doc("itens/a");
    const ok = await db.runTransaction(async (tx: any) => {
      const s = await tx.get(ref);
      if (s.data().aviso) return false;
      tx.update(ref, { aviso: 1 });
      return true;
    });
    expect(ok).toBe(true);
    expect((await ref.get()).data().aviso).toBe(1);
  });

  test("persiste no localStorage e sobrevive a recarregar o shim", async () => {
    const { db } = iniciar({ itens: {} });
    await db.collection("itens").doc("z").set({ nome: "Ecobag" });
    const { db: db2 } = iniciar({ itens: {} }, { limpar: false });
    expect((await db2.doc("itens/z").get()).data()).toEqual({ nome: "Ecobag" });
  });

  test("funciona sem localStorage (setItem lança)", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const { db } = iniciar({ itens: { a: { n: 1 } } });
    await db.collection("itens").add({ n: 2 });
    expect((await db.collection("itens").get()).size).toBe(2);
  });

  test("evento storage de outra aba atualiza listeners", async () => {
    const { db } = iniciar({ itens: { a: { n: 1 } } });
    const tamanhos: number[] = [];
    db.collection("itens").onSnapshot((s: any) => tamanhos.push(s.size));
    await Promise.resolve();
    const outraAba = JSON.parse(localStorage.getItem(CHAVE)!);
    outraAba.docs["itens/b"] = { n: 2 };
    localStorage.setItem(CHAVE, JSON.stringify(outraAba));
    window.dispatchEvent(new StorageEvent("storage", { key: CHAVE }));
    await tick();
    expect(tamanhos).toEqual([1, 2]);
  });

  test("demoStore.reset volta à semente e notifica listeners", async () => {
    const { db, demoStore } = iniciar({ itens: { a: { n: 1 } } });
    const tamanhos: number[] = [];
    db.collection("itens").onSnapshot((s: any) => tamanhos.push(s.size));
    await Promise.resolve();
    await db.collection("itens").add({ n: 2 });
    demoStore.reset();
    await tick();
    expect(tamanhos).toEqual([1, 2, 1]);
    expect((await db.collection("itens").get()).size).toBe(1);
  });
});

describe("auth, messaging e rede falsos", () => {
  test("onAuthStateChanged entrega o Visitante; signOut não desloga", async () => {
    const { auth } = iniciar();
    const u = await new Promise<any>((r) => auth.onAuthStateChanged(r));
    expect(u.uid).toBe("visitante");
    await auth.signOut();
    expect(auth.currentUser.uid).toBe("visitante");
    expect(await auth.currentUser.getIdToken()).toBe("demo");
  });

  test("constantes e cadastro pelo app secundário", async () => {
    const { firebase } = iniciar();
    expect(firebase.auth.Auth.Persistence.LOCAL).toBeTruthy();
    expect(firebase.auth.EmailAuthProvider.credential("a", "b")).toBeTruthy();
    const sec = firebase.initializeApp({}, "cadastro");
    expect(firebase.apps.find((a: any) => a.name === "cadastro")).toBe(sec);
    const r = await sec.auth().createUserWithEmailAndPassword("n@exemplo.com", "x");
    expect(r.user.uid).toBeTruthy();
  });

  test("messaging não faz nada", async () => {
    const { firebase } = iniciar();
    expect(await firebase.messaging().getToken()).toBe("");
    expect(() => firebase.messaging().onMessage(() => {})).not.toThrow();
  });

  test("fetch para /api/ responde ok sem rede", async () => {
    iniciar();
    const r = await window.fetch("/api/notify", { method: "POST" });
    expect(await r.json()).toEqual({ ok: true });
  });

  test("define configuração falsa", () => {
    iniciar();
    expect(w.FIREBASE_CONFIG.apiKey).toBe("demo");
  });
});
