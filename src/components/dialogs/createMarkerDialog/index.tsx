import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface Props {
  className?: string;
  open: boolean;
  setCreateMarkerDialogDisplayStatus: (open: boolean) => void;
  onconfirm: (title: string, description: string) => void;
  onOpenChange: (open: boolean) => void;
}
const CreateMarkerDialog: React.FC<Props> = (props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const onconfirm = () => {
    props.onconfirm(title, description);
    setTitle("");
    setDescription("");
    props.setCreateMarkerDialogDisplayStatus(false);
  };
  return (
    <Dialog
      defaultOpen={false}
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建一个标记</DialogTitle>
          <DialogDescription>
            你可以设置标记名称、时间、等任何文字信息
          </DialogDescription>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                标题
              </Label>
              <Input
                id="name"
                value={title}
                className="col-span-3"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                详情
              </Label>
              <Input
                id="username"
                value={description}
                className="col-span-3"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" onClick={onconfirm}>
            确定创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMarkerDialog;
