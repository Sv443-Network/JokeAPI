import { em } from "@/mikro-orm.config.js";
import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "@models/User.model.js";

export type ReportNoteProps = {
  text: string;
  authorId: string;
};

@Entity()
export class ReportNote {
  constructor(props: ReportNoteProps) {
    this.text = props.text;
    this.authorId = props.authorId;
    this.createdAt = this.updatedAt = new Date();
  }

  @PrimaryKey({ type: "string", generated: "uuid" })
    id!: string;

  @Property({ type: "string", length: 255 })
    text: string;

    @Property({ type: "string" })
      authorId: string;

    @ManyToOne({ entity: () => User })
    get author(): User {
      return em.getReference(User, this.authorId);
    }

  @Property({ type: "date" })
    createdAt: Date;

  @Property({ type: "date", onUpdate: () => new Date() })
    updatedAt: Date;

  @Property({ type: "date", nullable: true })
    deletedAt?: Date;
}
