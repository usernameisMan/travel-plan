"use client";

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
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";

interface Props {
  className?: string;
  open: boolean;
  setCreateMarkerDialogDisplayStatus: (open: boolean) => void;
  onconfirm: (title: string, description: string) => void;
  onOpenChange: (open: boolean) => void;
}
const CreateMarkerDialog: React.FC<Props> = (props) => {
  const { language } = useLanguageStore();
  const t = useTranslation(language);
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
          <DialogTitle>{t.createMarker}</DialogTitle>
          <DialogDescription>
            {t.markerDescription}
          </DialogDescription>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t.title}
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
                {t.description}
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
            {t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMarkerDialog;
