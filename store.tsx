import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { seedData } from "./seed";
import { DEMO_REVISION, refreshDemoData } from "./demo-data";
import { isServiceLocation, canPostProperty, toggleCompareList, validateReview } from "./rules";
import type {
  AppData,
  Conversation,
  DocType,
  Property,
  PropertyStatus,
  ReportTarget,
  User,
  VerificationStatus,
} from "./types";

const STORAGE_KEY = "dark-app-state-v2";

type Result = { ok: true } | { ok: false; error: string };

export type PropertyInput = Omit<
  Property,
  "id" | "ownerId" | "approval" | "rejectReason" | "postDate" | "views" | "status"
> & { status?: PropertyStatus };

interface Persisted extends AppData {
  currentUserId: string | null;
  compare: string[];
  demoRevision: number;
}

const uid = (p: string) =>
  `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function initial(): Persisted {
  return {
    ...structuredClone(seedData),
    currentUserId: null,
    compare: [],
    demoRevision: DEMO_REVISION,
  };
}

function useStoreValue() {
  const [state, setState] = useState<Persisted>(initial);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Persisted;
        const merged = { ...initial(), ...saved };
        setState({
          ...merged,
          ...refreshDemoData(merged, saved.demoRevision ?? 0),
          demoRevision: DEMO_REVISION,
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota exceeded — keep in memory */
    }
  }, [state, hydrated]);

  const update = useCallback((fn: (s: Persisted) => Persisted) => setState((s) => fn(s)), []);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const getVerificationStatus = useCallback(
    (userId: string): VerificationStatus =>
      state.verifications.find((v) => v.userId === userId)?.status ?? "none",
    [state.verifications],
  );

  /* ---------------- Accounts ---------------- */
  const login = (email: string, password: string): Result => {
    const u = stateRef.current.users.find(
      (x) => x.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!u || u.password !== password)
      return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    if (u.suspended) return { ok: false, error: "تم إيقاف هذا الحساب من قبل الإدارة" };
    update((s) => ({ ...s, currentUserId: u.id }));
    return { ok: true };
  };

  const register = (
    d: Pick<User, "firstName" | "lastName" | "email" | "phone" | "password">,
  ): Result => {
    if (stateRef.current.users.some((u) => u.email.toLowerCase() === d.email.trim().toLowerCase()))
      return { ok: false, error: "هذا البريد الإلكتروني مسجل مسبقًا" };
    const user: User = {
      ...d,
      email: d.email.trim(),
      id: uid("u"),
      role: "user",
      joinDate: now().slice(0, 10),
      suspended: false,
    };
    update((s) => ({ ...s, users: [...s.users, user], currentUserId: user.id }));
    return { ok: true };
  };

  const logout = () =>
    update((s) => ({ ...s, currentUserId: null, compare: [], demoRevision: DEMO_REVISION }));

  const updateProfile = (d: Pick<User, "firstName" | "lastName" | "email" | "phone">): Result => {
    const me = stateRef.current.currentUserId;
    if (
      stateRef.current.users.some(
        (u) => u.id !== me && u.email.toLowerCase() === d.email.trim().toLowerCase(),
      )
    )
      return { ok: false, error: "هذا البريد الإلكتروني مستخدم من حساب آخر" };
    update((s) => ({ ...s, users: s.users.map((u) => (u.id === me ? { ...u, ...d } : u)) }));
    return { ok: true };
  };

  const changePassword = (current: string, next: string): Result => {
    const me = stateRef.current.users.find((u) => u.id === stateRef.current.currentUserId);
    if (!me || me.password !== current)
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    update((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === me.id ? { ...u, password: next } : u)),
    }));
    return { ok: true };
  };

  const emailExists = (email: string) =>
    stateRef.current.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  const resetPassword = (email: string, next: string) =>
    update((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() ? { ...u, password: next } : u,
      ),
    }));

  /* ---------------- Verification ---------------- */
  const submitVerification = (docType: DocType, docNo: string, docImage?: string) => {
    const me = stateRef.current.currentUserId;
    if (!me) return;
    update((s) => ({
      ...s,
      verifications: [
        ...s.verifications.filter((v) => v.userId !== me),
        {
          id: uid("v"),
          userId: me,
          docType,
          docNo,
          docImage,
          submitDate: now(),
          status: "pending",
        },
      ],
    }));
  };

  const reviewVerification = (userId: string, approve: boolean, note?: string) =>
    update((s) => ({
      ...s,
      verifications: s.verifications.map((v) =>
        v.userId === userId ? { ...v, status: approve ? "approved" : "rejected", note } : v,
      ),
    }));

  /* ---------------- Properties ---------------- */
  const addProperty = (
    d: PropertyInput,
  ): { ok: true; id: string } | { ok: false; error: string } => {
    const me = stateRef.current.currentUserId;
    if (!me) return { ok: false, error: "يجب تسجيل الدخول" };
    const ver = stateRef.current.verifications.find((v) => v.userId === me)?.status ?? "none";
    if (!canPostProperty(ver)) return { ok: false, error: "يجب توثيق هويتك قبل نشر العقارات" };
    if (!isServiceLocation(d.city, d.district))
      return { ok: false, error: "دارك يخدم المكلا وحاراتها فقط" };
    const id = uid("p");
    const p: Property = {
      ...d,
      status: d.status ?? "available",
      id,
      ownerId: me,
      approval: "pending",
      postDate: now(),
      views: 0,
    };
    update((s) => ({ ...s, properties: [p, ...s.properties] }));
    return { ok: true, id };
  };

  const updateProperty = (id: string, d: PropertyInput) => {
    if (!isServiceLocation(d.city, d.district)) return;
    update((s) => ({
      ...s,
      properties: s.properties.map((p) =>
        p.id === id ? { ...p, ...d, approval: "pending", rejectReason: undefined } : p,
      ),
    }));
  };

  const deleteProperty = (id: string) =>
    update((s) => ({
      ...s,
      properties: s.properties.filter((p) => p.id !== id),
      reviews: s.reviews.filter((r) => r.propertyId !== id),
      compare: s.compare.filter((x) => x !== id),
      favorites: Object.fromEntries(
        Object.entries(s.favorites).map(([k, v]) => [k, v.filter((x) => x !== id)]),
      ),
    }));

  const setPropertyStatus = (id: string, status: PropertyStatus) =>
    update((s) => ({
      ...s,
      properties: s.properties.map((p) => (p.id === id ? { ...p, status } : p)),
    }));

  const approveProperty = (id: string) =>
    update((s) => ({
      ...s,
      properties: s.properties.map((p) =>
        p.id === id ? { ...p, approval: "approved", rejectReason: undefined } : p,
      ),
    }));

  const rejectProperty = (id: string, reason: string) =>
    update((s) => ({
      ...s,
      properties: s.properties.map((p) =>
        p.id === id ? { ...p, approval: "rejected", rejectReason: reason } : p,
      ),
    }));

  const incrementView = (id: string) =>
    update((s) => ({
      ...s,
      properties: s.properties.map((p) => (p.id === id ? { ...p, views: p.views + 1 } : p)),
    }));

  /* ---------------- Favorites & compare ---------------- */
  const favoriteIds = currentUser ? (state.favorites[currentUser.id] ?? []) : [];

  const toggleFavorite = (id: string): boolean => {
    const me = stateRef.current.currentUserId;
    if (!me) return false;
    const list = stateRef.current.favorites[me] ?? [];
    const has = list.includes(id);
    update((s) => ({
      ...s,
      favorites: { ...s.favorites, [me]: has ? list.filter((x) => x !== id) : [id, ...list] },
    }));
    return !has;
  };

  const toggleCompare = (id: string): string | undefined => {
    const r = toggleCompareList(stateRef.current.compare, id);
    if (!r.error) update((s) => ({ ...s, compare: r.list }));
    return r.error;
  };
  const clearCompare = () => update((s) => ({ ...s, compare: [] }));

  /* ---------------- Messaging ---------------- */
  const startConversation = (propertyId: string): string | null => {
    const s = stateRef.current;
    const me = s.currentUserId;
    const p = s.properties.find((x) => x.id === propertyId);
    if (!me || !p) return null;
    const existing = s.conversations.find((c) => c.propertyId === propertyId && c.seekerId === me);
    if (existing) return existing.id;
    const conv: Conversation = {
      id: uid("c"),
      propertyId,
      seekerId: me,
      ownerId: p.ownerId,
      messages: [],
    };
    update((st) => ({ ...st, conversations: [conv, ...st.conversations] }));
    return conv.id;
  };

  const sendMessage = (convId: string, content: string) => {
    const me = stateRef.current.currentUserId;
    if (!me || !content.trim()) return;
    update((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: uid("m"), senderId: me, content: content.trim(), sentAt: now(), read: false },
              ],
            }
          : c,
      ),
    }));
  };

  const markRead = (convId: string) => {
    const me = stateRef.current.currentUserId;
    const conv = stateRef.current.conversations.find((c) => c.id === convId);
    if (!me || !conv || !conv.messages.some((m) => m.senderId !== me && !m.read)) return;
    update((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) => (m.senderId !== me ? { ...m, read: true } : m)),
            }
          : c,
      ),
    }));
  };

  const myConversations = currentUser
    ? state.conversations.filter(
        (c) => c.seekerId === currentUser.id || c.ownerId === currentUser.id,
      )
    : [];
  const unreadCount = currentUser
    ? myConversations.reduce(
        (n, c) => n + c.messages.filter((m) => m.senderId !== currentUser.id && !m.read).length,
        0,
      )
    : 0;

  /* ---------------- Reviews & reports ---------------- */
  const addReview = (propertyId: string, rating: number, comment: string): Result => {
    const s = stateRef.current;
    const user = s.users.find((u) => u.id === s.currentUserId) ?? null;
    const property = s.properties.find((p) => p.id === propertyId);
    if (!property) return { ok: false, error: "العقار غير موجود" };
    const err = validateReview({ user, property, rating, comment, existing: s.reviews });
    if (err) return { ok: false, error: err };
    if (!user) return { ok: false, error: "يجب تسجيل الدخول لإضافة تقييم" };
    update((st) => ({
      ...st,
      reviews: [
        { id: uid("r"), userId: user.id, propertyId, rating, comment: comment.trim(), date: now() },
        ...st.reviews,
      ],
    }));
    return { ok: true };
  };

  const deleteReview = (id: string) =>
    update((s) => ({ ...s, reviews: s.reviews.filter((r) => r.id !== id) }));

  const addReport = (
    targetType: ReportTarget,
    targetId: string,
    propertyId: string,
    reason: string,
    details: string,
  ) => {
    const me = stateRef.current.currentUserId;
    if (!me) return;
    const snapshot =
      targetType === "review"
        ? stateRef.current.reviews.find((r) => r.id === targetId)?.comment
        : undefined;
    update((s) => ({
      ...s,
      reports: [
        {
          id: uid("rep"),
          userId: me,
          targetType,
          targetId,
          propertyId,
          reason,
          details,
          status: "open",
          date: now(),
          snapshot,
        },
        ...s.reports,
      ],
    }));
  };

  /** Admin: remove the reported content, or dismiss the report. */
  const resolveReport = (id: string, action: "remove" | "dismiss") => {
    const rep = stateRef.current.reports.find((r) => r.id === id);
    if (!rep) return;
    update((s) => {
      let next: Persisted = {
        ...s,
        reports: s.reports.map((r) =>
          r.id === id ? { ...r, status: action === "remove" ? "resolved" : "dismissed" } : r,
        ),
      };
      if (action === "remove") {
        if (rep.targetType === "review") {
          next = { ...next, reviews: next.reviews.filter((r) => r.id !== rep.targetId) };
        } else {
          next = {
            ...next,
            properties: next.properties.map((p) =>
              p.id === rep.targetId
                ? {
                    ...p,
                    approval: "rejected",
                    rejectReason: `أُوقف الإعلان بسبب بلاغ: ${rep.reason}`,
                  }
                : p,
            ),
          };
        }
      }
      return next;
    });
  };

  /* ---------------- Users (admin) ---------------- */
  const toggleSuspend = (userId: string) =>
    update((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, suspended: !u.suspended } : u)),
    }));

  const deleteUser = (userId: string) =>
    update((s) => {
      const ownedIds = new Set(s.properties.filter((p) => p.ownerId === userId).map((p) => p.id));
      const { [userId]: _removed, ...favorites } = s.favorites;
      return {
        ...s,
        users: s.users.filter((u) => u.id !== userId),
        verifications: s.verifications.filter((v) => v.userId !== userId),
        properties: s.properties.filter((p) => !ownedIds.has(p.id)),
        reviews: s.reviews.filter((r) => r.userId !== userId && !ownedIds.has(r.propertyId)),
        conversations: s.conversations.filter((c) => c.seekerId !== userId && c.ownerId !== userId),
        favorites,
      };
    });

  return {
    ...state,
    hydrated,
    currentUser,
    getVerificationStatus,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    emailExists,
    resetPassword,
    submitVerification,
    reviewVerification,
    addProperty,
    updateProperty,
    deleteProperty,
    setPropertyStatus,
    approveProperty,
    rejectProperty,
    incrementView,
    favoriteIds,
    toggleFavorite,
    toggleCompare,
    clearCompare,
    startConversation,
    sendMessage,
    markRead,
    myConversations,
    unreadCount,
    addReview,
    deleteReview,
    addReport,
    resolveReport,
    toggleSuspend,
    deleteUser,
    userById: (id: string) => state.users.find((u) => u.id === id),
    propertyById: (id: string) => state.properties.find((p) => p.id === id),
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const fullName = (u?: Pick<User, "firstName" | "lastName"> | null) =>
  u ? `${u.firstName} ${u.lastName}` : "مستخدم";
