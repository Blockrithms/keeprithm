"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Message } from "~/types";
import { CopyToClipboard } from "~/components/common/copy-to-clipboard";
import { parseSlackMessage } from "~/lib/utils";
import { useWorkspace } from "~/context/workspace-context";

export const RenderMarkdown = ({ message }: { message: Message }) => {
  const { workspace, user } = useWorkspace();
  const members = workspace?.members ?? [];
  const selfByName = members.find(
    (member) =>
      member.slackId &&
      member.name &&
      user?.name &&
      member.name.trim().toLowerCase() === user.name.trim().toLowerCase()
  );
  const users = Object.fromEntries(
    members
      .filter((member) => member.slackId && member.name)
      .map((member) => [member.slackId, member.name])
  );
  const channels = Object.fromEntries(
    (workspace?.channels ?? [])
      .filter((channel) => channel.slackId && channel.name)
      .map((channel) => [channel.slackId, channel.name])
  );
  const formattedMessage = parseSlackMessage(message, {
    users,
    channels,
    currentUserId: user?.slackId || selfByName?.slackId,
    currentUserName: user?.name,
  });

  return (
    <div className="text-sm leading-relaxed message-markdown max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ node, ...props }: any) => (
            <a
              {...props}
              className="markdown-block text-blue-500 hover:underline"
            />
          ),
          ul: ({ node, ...props }: any) => (
            <ul {...props} className="list-disc pl-2 sm:pl-6 py-1" />
          ),
          p: ({ node, ...props }: any) => (
            <p {...props} className="markdown-block max-w-[calc(100%-16px)]" />
          ),
          ol: ({ node, ...props }: any) => (
            <ol {...props} className="list-decimal pl-2 sm:pl-6 py-1" />
          ),
          pre: ({ node, children, ...props }: any) => {
            const codeElement: any = Array.isArray(children)
              ? children[0]
              : children;
            const codeContent =
              typeof codeElement?.props?.children === "string"
                ? codeElement.props.children
                : Array.isArray(codeElement?.props?.children)
                ? codeElement.props.children.join("")
                : "";

            return (
              <div className="relative my-2 max-sm:mr-1 text-xs group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <CopyToClipboard text={codeContent.trim()} />
                </div>
                <pre
                  {...props}
                  className="bg-muted p-2 font-thin border rounded"
                >
                  {children}
                </pre>
              </div>
            );
          },
          code: ({ node, ...props }: any) => (
            <code
              {...props}
              className="markdown-block bg-muted p-1 rounded leading-5"
            />
          ),
          strong: ({ node, ...props }: any) => (
            <strong {...props} className="font-semibold" />
          ),
        }}
      >
        {formattedMessage}
      </ReactMarkdown>
    </div>
  );
};
