import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import type { AccountTier, UserRole } from "@/types/user.js";

export type UserProps = {
  username: string;
  email: string;
  tier: AccountTier;
  roles: UserRole[];
};

@Entity()
export class User {
  constructor(props: UserProps) {
    this.username = props.username;
    this.email = props.email;
    this.createdAt = this.updatedAt = new Date();
  }

  @PrimaryKey({ type: "string", generated: "uuid" })
    id!: string;

  @PrimaryKey({ type: "string", length: 24 })
    username: string;

  @Property({ type: "string", length: 320 })
    email: string;

  @Property({ type: "string", length: 16 })
    tier: AccountTier = "free";

  @Property({ type: "array", length: 16, runtimeType: "string" })
    roles = ["user"];

  // TODO:

  // @OneToOne({ entity: () => UserSettings, orphanRemoval: true })
  //   settings: UserSettings;

  // @OneToOne({ entity: () => UserBilling, orphanRemoval: true })
  //   billing: Billing;

  // @OneToMany({ entity: () => ReportNote, mappedBy: "author" })
  //   connections: Connection[];

  @Property({ type: "date" })
    createdAt: Date;

  @Property({ type: "date", onUpdate: () => new Date() })
    updatedAt: Date;

  @Property({ type: "date", nullable: true })
    deletedAt?: Date;
}
