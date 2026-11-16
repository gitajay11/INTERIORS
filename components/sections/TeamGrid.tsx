"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Avatar } from "@/components/sections/common";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/primitives";
import type { TeamMember } from "@/lib/types";

function Portrait({ member, className }: { member: TeamMember; className: string }) {
  if (member.photo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={member.photo.src}
          alt={member.photo.alt || member.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
        />
      </div>
    );
  }
  return <Avatar name={member.name} tint={member.tint} className={`${className} text-3xl`} />;
}

/** Team grid; selecting a person opens their biography in a modal. */
export function TeamGrid({ team }: { team: TeamMember[] }) {
  const [selected, setSelected] = useState<TeamMember | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
        {team.map((member) => (
          <li key={member.slug}>
            <button
              type="button"
              onClick={() => setSelected(member)}
              className="group block w-full text-left"
              aria-haspopup="dialog"
            >
              <div className="overflow-hidden rounded-sm">
                <Portrait
                  member={member}
                  className="aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <span className="mt-4 flex items-baseline justify-between gap-3">
                <span className="font-serif text-2xl">{member.name}</span>
                <ArrowUpRight
                  className="text-accent size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden
                />
              </span>
              <span className="text-fg-muted mt-1 block text-sm">{member.role}</span>
              <span className="sr-only">Read biography</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="p-0">
          {selected && (
            <div className="grid sm:grid-cols-5">
              <Portrait
                member={selected}
                className="aspect-[4/3] w-full sm:col-span-2 sm:aspect-auto sm:min-h-full"
              />
              <div className="p-7 sm:col-span-3 sm:p-9">
                <DialogTitle className="pr-10 font-serif text-3xl">{selected.name}</DialogTitle>
                <DialogDescription className="text-accent mt-1 text-sm font-medium">
                  {selected.role}
                </DialogDescription>
                <div className="text-fg-muted mt-5 space-y-3 leading-relaxed">
                  {selected.bio.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Areas of expertise">
                  {selected.expertise.map((item) => (
                    <li key={item} className="border-border rounded-full border px-3 py-1 text-xs">
                      {item}
                    </li>
                  ))}
                </ul>
                <ul className="mt-6 flex gap-5">
                  {selected.socials.map((social) => (
                    <li key={social.name}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent inline-flex min-h-11 items-center gap-1 text-sm font-medium"
                      >
                        {social.name} <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
