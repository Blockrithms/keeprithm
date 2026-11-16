import { AlertCircle } from "lucide-react";

export const WorkspaceRegisterWarning = () => {
  return (
    <div className="flex items-start p-3 text-sm text-yellow-700 bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
      <AlertCircle className="w-9 h-9 mr-2 text-yellow-600 -translate-y-2" />
      <p>
        Only the <strong>Primary Workspace Owner</strong> can register this
        workspace. If you are not the owner, please contact them for assistance.
      </p>
    </div>
  );
};
