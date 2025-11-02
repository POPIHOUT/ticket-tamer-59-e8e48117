import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Loader2, QrCode, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TwoFactorAuthProps {
  userId: string;
}

export const TwoFactorAuth = ({ userId }: TwoFactorAuthProps) => {
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, [userId]);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactor = data?.totp?.find((f) => f.status === "verified");
      setIsEnabled(!!totpFactor);
    } catch (error) {
      console.error("Error checking MFA status:", error);
    }
  };

  const handleEnableMFA = async () => {
    setSetupLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      if (data) {
        const svgQRCode = data.totp.qr_code;
        const url = `data:image/svg+xml;utf8,${encodeURIComponent(svgQRCode)}`;
        setQrCodeUrl(url);
        setSecret(data.totp.secret);
        setOtpauthUrl(data.totp.uri);
        setShowSetupDialog(true);
      }
    } catch (error: any) {
      toast.error("Failed to enable 2FA: " + error.message);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totpFactor = factors.data?.totp?.[0];
      if (!totpFactor) throw new Error("No TOTP factor found");

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactor.id,
        code: verificationCode,
      });

      if (error) throw error;

      toast.success("2FA enabled successfully!");
      setIsEnabled(true);
      setShowSetupDialog(false);
      setVerificationCode("");
      setQrCodeUrl("");
      setSecret("");
      setOtpauthUrl("");
    } catch (error: any) {
      toast.error("Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    setLoading(true);
    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const totpFactor = factors?.totp?.find((f) => f.status === "verified");
      if (!totpFactor) throw new Error("No verified TOTP factor found");

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (error) throw error;

      toast.success("2FA disabled successfully");
      setIsEnabled(false);
    } catch (error: any) {
      toast.error("Failed to disable 2FA: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Status: {isEnabled ? (
                  <span className="text-success flex items-center gap-1 inline-flex">
                    <Check className="h-4 w-4" />
                    Enabled
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1 inline-flex">
                    <X className="h-4 w-4" />
                    Disabled
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {isEnabled 
                  ? "Your account is protected with 2FA" 
                  : "Protect your account with an authenticator app"}
              </p>
            </div>
            {isEnabled ? (
              <Button
                onClick={handleDisableMFA}
                disabled={loading}
                variant="destructive"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Disable 2FA
              </Button>
            ) : (
              <Button
                onClick={handleEnableMFA}
                disabled={setupLoading}
                variant="default"
              >
                {setupLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
              {qrCodeUrl && (
                <div className="flex flex-col items-center gap-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  <div className="w-full space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Or enter this code manually:
                    </p>
                    <div className="bg-muted p-3 rounded-lg">
                      <code className="text-sm font-mono break-all">{secret}</code>
                    </div>
                  </div>

                  {otpauthUrl && (
                    <div className="w-full space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        If scanning fails, use this setup link:
                      </p>
                      <div className="bg-muted p-3 rounded-lg break-all text-center">
                        <a href={otpauthUrl}>{otpauthUrl}</a>
                      </div>
                    </div>
                  )}
                </div>
              )}

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSetupDialog(false);
                  setVerificationCode("");
                  setQrCodeUrl("");
                  setSecret("");
                  setOtpauthUrl("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verify & Enable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
