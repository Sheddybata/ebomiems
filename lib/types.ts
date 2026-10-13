export type Role = "admin" | "bursar" | "teacher" | "parent";

export type SessionUser = {
  id: number;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
};

export type Scale = "primary" | "waec";

export type Assessment =
  | { kind: "qualitative" }
  | { kind: "numeric"; scale: Scale; caMax: number; examMax: number };

export class SchoolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchoolError";
  }
}
