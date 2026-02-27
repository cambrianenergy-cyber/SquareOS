import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, DocumentData, QueryConstraint } from "firebase/firestore";

export function useApprovalTasks(filter: { status?: string } = {}) {
  const [tasks, setTasks] = useState<DocumentData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const constraints: QueryConstraint[] = [];
    if (filter.status) {
      constraints.push(where("status", "==", filter.status));
    }
    const q = query(collection(db, "approval_tasks"), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });
    return () => unsub();
  }, [filter.status]);

  return [tasks, loading, error] as const;
}
