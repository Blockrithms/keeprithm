import { SlackButton, WorkspaceRegisterWarning } from "~/components/common";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui";

interface AddWorkspaceModalProps {
  open: boolean;
  handleClose: () => void;
}

export const AddWorkspaceModal: React.FC<AddWorkspaceModalProps> = ({
  open,
  handleClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a workspace</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <WorkspaceRegisterWarning />
          <SlackButton title="Add to Slack" state="workspace_register" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
