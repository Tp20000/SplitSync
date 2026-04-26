// FILE: apps/web/src/components/settings/DangerZone.tsx
// PURPOSE: Danger zone — account deletion (stub)
// DEPENDS ON: shadcn/ui
// LAST UPDATED: F38 - User Settings

"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/stores/authStore";

export function DangerZone() {
  const { logout } = useAuthStore();

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle size={16} />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logout all sessions */}
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
          <div>
            <p className="text-sm font-medium">
              Sign out everywhere
            </p>
            <p className="text-xs text-muted-foreground">
              Sign out from all devices and sessions
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                Sign out all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Sign out from all devices?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You will be signed out from every device and
                  browser. You will need to log in again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void logout()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sign out everywhere
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Delete account (stub) */}
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all data
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled
          >
            Coming soon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}