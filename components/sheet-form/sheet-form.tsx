import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ReactNode } from "react";

interface SheetFormProps {
  label: string;
  title: string;
  description: string;
}

export function SheetForm({ label, title, description }: SheetFormProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default" size="sm">
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full w-[400px] max-w-[400px] flex-col sm:w-1/3 sm:max-w-1/3">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Form Content - Scrollable Area */}
        <ScrollArea className="flex-1">
          <div className="grid auto-rows-min gap-6 px-4">
            <div className="grid gap-3">
              <Label htmlFor="sheet-demo-name">Name</Label>
              <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="sheet-demo-username">Username</Label>
              <Input id="sheet-demo-username" defaultValue="@peduarte" />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
