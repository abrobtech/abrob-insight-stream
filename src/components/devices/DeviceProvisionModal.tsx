import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (device: any) => void;
};

export default function DeviceProvisionModal({ open, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [imei, setImei] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [deviceType, setDeviceType] = useState("vehicle");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    if (!open) {
      // Reset form when closed
      setImei("");
      setDeviceName("");
      setOwnerEmail("");
      setDeviceType("vehicle");
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!imei.trim()) e.imei = "IMEI is required";
    if (!deviceName.trim()) e.deviceName = "Device name is required";
    // basic email validation (optional)
    if (ownerEmail && !/^\S+@\S+\.\S+$/.test(ownerEmail)) e.ownerEmail = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      // Example: POST to your API endpoint that provisions a device.
      // Replace the endpoint below with your serverless function or backend route.
      // The repo also includes a generated Supabase client (src/integrations/supabase/client.ts).
      // If you want to use Supabase directly here, import and use that client instead.
      //
      // Example Supabase usage (if you add credentials on the server side, do NOT commit keys to repo):
      // import { createClient } from '@supabase/supabase-js'
      // const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      // const { data, error } = await supabase.from('devices').insert({ imei, name: deviceName, owner_id: ownerEmail, ... })
      //
      // For now we call a placeholder REST endpoint:
      const resp = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imei: imei.trim(),
          name: deviceName.trim(),
          owner_email: ownerEmail.trim(),
          type: deviceType,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        toast({ variant: "destructive", title: "Failed to provision device", description: errBody || resp.statusText });
      } else {
        const created = await resp.json().catch(() => null);
        toast({ title: "Device provisioned", description: "Device was successfully added." });
        onCreated?.(created ?? { imei, name: deviceName, owner_email: ownerEmail, type: deviceType });
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: err?.message || "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onClose()} />
      <div className="relative w-full max-w-2xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="imei">IMEI</Label>
                <Input id="imei" value={imei} onChange={(e) => setImei(e.target.value)} />
                {errors.imei && <div className="text-sm text-red-600 mt-1">{errors.imei}</div>}
              </div>

              <div>
                <Label htmlFor="deviceName">Device Name</Label>
                <Input id="deviceName" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
                {errors.deviceName && <div className="text-sm text-red-600 mt-1">{errors.deviceName}</div>}
              </div>

              <div>
                <Label htmlFor="ownerEmail">Owner Email (optional)</Label>
                <Input id="ownerEmail" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                {errors.ownerEmail && <div className="text-sm text-red-600 mt-1">{errors.ownerEmail}</div>}
              </div>

              <div>
                <Label htmlFor="deviceType">Device Type</Label>
                <select
                  id="deviceType"
                  className="w-full p-2 border rounded-md"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                >
                  <option value="vehicle">Vehicle Tracker</option>
                  <option value="personal">Personal Tracker</option>
                  <option value="asset">Asset Tracker</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Provisioning..." : "Provision Device"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
