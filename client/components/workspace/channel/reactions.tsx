"use client";
import { cn, getEmoji, getBaseEmojiName } from "~/lib/utils";
import { Hint } from "~/components/common/hint";
import { GroupedReactions, MessageReaction } from "~/types";

export const Reactions = ({ data }: { data: MessageReaction[] }) => {
  if (!data || data.length === 0) return null;

  const grouped: GroupedReactions = {};

  for (const reaction of data) {
    const base = getBaseEmojiName(reaction.name);
    if (!base) continue;

    if (!grouped[base]) {
      grouped[base] = { total: 0, variants: [] };
    }

    grouped[base].total += reaction.count;
    grouped[base].variants.push(reaction);
  }

  return (
    <div className="flex items-center gap-1 mt-1 mb-1 flex-wrap">
      {Object.entries(grouped).map(([baseName, group]) => {
        const uniqueVariants = Array.from(
          new Map(group.variants.map((r) => [r.name, r])).values()
        );

        const emojiVariants = uniqueVariants.map((r, idx) => (
          <span key={r.name + idx} className="mx-[1px]">
            {getEmoji(r.name)}
          </span>
        ));

        return (
          <Hint
            key={baseName}
            label={`${group.total} ${
              group.total === 1 ? "person" : "people"
            } reacted with ${uniqueVariants
              .map((r) => getEmoji(r.name))
              .join(" ")}`}
          >
            <div className="h-[22px] text-[14.5px] px-2 rounded-full bg-muted border border-transparent text-muted-foreground flex items-center gap-x-1 cursor-pointer hover:bg-muted/80 select-none transition-colors">
              <span>{emojiVariants}</span>
              <span className="text-xs text-muted-foreground font-semibold">
                {group.total}
              </span>
            </div>
          </Hint>
        );
      })}
    </div>
  );
};
