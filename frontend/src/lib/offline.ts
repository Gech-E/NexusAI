'use client';
/** User-partitioned browser storage. Never cache answer keys or auth credentials. */
export interface CachedQuiz {attempt_id:string; quiz_title:string; description:string|null; questions:{id:string;prompt:string;choices:string[];difficulty:number;topic_tags:string[]}[];total_questions:number}
export interface QueuedQuiz {quizId:string; attemptId:string; answers:Record<string,number>; queuedAt:number}
export interface CachedLesson {id:string;title:string;subject:string;description:string|null;syllabus:Record<string,unknown>;downloadedAt:number}
const NAME='nexus-offline-v1', TABLE='items';
function db():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(TABLE))r.result.createObjectStore(TABLE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function request<T>(userId:string,kind:string,id:string,method:'get'|'put'|'delete',value?:T):Promise<T|undefined>{const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(TABLE,method==='get'?'readonly':'readwrite');const s=t.objectStore(TABLE);const k=[userId,kind,id].join(':');const r=method==='get'?s.get(k):method==='put'?s.put(value,k):s.delete(k);r.onsuccess=()=>resolve(r.result as T|undefined);r.onerror=()=>reject(r.error);t.oncomplete=()=>d.close();t.onabort=()=>{d.close();reject(t.error)}})}
export const saveQuiz=(u:string,id:string,q:CachedQuiz)=>request(u,'quiz',id,'put',q).then(()=>{});
export const getQuiz=(u:string,id:string)=>request<CachedQuiz>(u,'quiz',id,'get');
export const saveLesson=(u:string,id:string,l:CachedLesson)=>request(u,'lesson',id,'put',l).then(()=>{});
export const getLesson=(u:string,id:string)=>request<CachedLesson>(u,'lesson',id,'get');
export const queueAttempt=(u:string,id:string,a:QueuedQuiz)=>request(u,'pending',id,'put',a).then(()=>{});
export const deleteAttempt=(u:string,id:string)=>request(u,'pending',id,'delete').then(()=>{});
export async function pendingAttempts(userId:string):Promise<QueuedQuiz[]>{const d=await db();return new Promise((resolve,reject)=>{const out:QueuedQuiz[]=[];const tx=d.transaction(TABLE,'readonly');const req=tx.objectStore(TABLE).openCursor();req.onsuccess=()=>{const c=req.result;if(c){if(String(c.key).startsWith(userId+':pending:'))out.push(c.value as QueuedQuiz);c.continue()}else resolve(out)};req.onerror=()=>reject(req.error);tx.oncomplete=()=>d.close()})}
