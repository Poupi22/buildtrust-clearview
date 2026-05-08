import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUploadMedia } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export function UploadMediaDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const upload = useUploadMedia();

  const submit = async () => {
    if (!file) { toast.error("Pick a file"); return; }
    try {
      await upload.mutateAsync({ project_id: projectId, file, caption });
      toast.success("Uploaded");
      setOpen(false);
      setFile(null);
      setCaption("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Upload className="h-4 w-4 mr-1" />Upload photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload media</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>File</Label>
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <Label>Caption (optional)</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={upload.isPending}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
