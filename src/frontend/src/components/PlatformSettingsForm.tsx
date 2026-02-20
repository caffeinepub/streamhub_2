import { useState, useEffect } from 'react';
import { useGetPlatformSettings, useUpdatePlatformSettings } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import SettingsConfirmDialog from './SettingsConfirmDialog';
import { toast } from 'sonner';
import type { PlatformSettings } from '../backend';

const allCategories = ['Education', 'Entertainment', 'Music', 'Gaming', 'News', 'Sports', 'Technology'];

export default function PlatformSettingsForm() {
  const { data: settings, isLoading } = useGetPlatformSettings();
  const [maxVideoSize, setMaxVideoSize] = useState('500');
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [moderationPolicies, setModerationPolicies] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setMaxVideoSize(settings.maxVideoSizeMB.toString());
      setAllowedCategories(settings.allowedCategories);
      setModerationPolicies(settings.moderationPolicies);
    }
  }, [settings]);

  useEffect(() => {
    if (settings) {
      const changed =
        maxVideoSize !== settings.maxVideoSizeMB.toString() ||
        JSON.stringify(allowedCategories.sort()) !== JSON.stringify([...settings.allowedCategories].sort()) ||
        moderationPolicies !== settings.moderationPolicies;
      setHasChanges(changed);
    }
  }, [maxVideoSize, allowedCategories, moderationPolicies, settings]);

  const toggleCategory = (category: string) => {
    setAllowedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const selectAllCategories = () => {
    setAllowedCategories(allCategories);
  };

  const deselectAllCategories = () => {
    setAllowedCategories([]);
  };

  const handleReset = () => {
    if (settings) {
      setMaxVideoSize(settings.maxVideoSizeMB.toString());
      setAllowedCategories(settings.allowedCategories);
      setModerationPolicies(settings.moderationPolicies);
    }
  };

  const handleSave = () => {
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }
    setShowConfirmDialog(true);
  };

  const getChangeSummary = () => {
    if (!settings) return [];
    const changes: string[] = [];

    if (maxVideoSize !== settings.maxVideoSizeMB.toString()) {
      changes.push(`Max video size: ${settings.maxVideoSizeMB}MB → ${maxVideoSize}MB`);
    }

    const oldCats = [...settings.allowedCategories].sort();
    const newCats = [...allowedCategories].sort();
    if (JSON.stringify(oldCats) !== JSON.stringify(newCats)) {
      changes.push(`Allowed categories updated`);
    }

    if (moderationPolicies !== settings.moderationPolicies) {
      changes.push('Moderation policies updated');
    }

    return changes;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
          <CardDescription>Configure global platform parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Max Video Size */}
          <div className="space-y-2">
            <Label htmlFor="maxVideoSize">Maximum Video File Size (MB)</Label>
            <Input
              id="maxVideoSize"
              type="number"
              min="1"
              max="5000"
              value={maxVideoSize}
              onChange={(e) => setMaxVideoSize(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum file size allowed for video uploads (1-5000 MB)
            </p>
          </div>

          {/* Allowed Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Allowed Video Categories</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllCategories}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllCategories}>
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {allCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={allowedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <Label htmlFor={category} className="cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {allowedCategories.length} / {allCategories.length}
            </p>
          </div>

          {/* Moderation Policies */}
          <div className="space-y-2">
            <Label htmlFor="moderationPolicies">Moderation Policies</Label>
            <Textarea
              id="moderationPolicies"
              value={moderationPolicies}
              onChange={(e) => setModerationPolicies(e.target.value)}
              rows={6}
              placeholder="Enter platform moderation policies and guidelines..."
            />
            <p className="text-xs text-muted-foreground">
              {moderationPolicies.length} characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={!hasChanges}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <SettingsConfirmDialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          changes={getChangeSummary()}
          newSettings={{
            maxVideoSizeMB: BigInt(maxVideoSize),
            allowedCategories,
            moderationPolicies,
          }}
        />
      )}
    </>
  );
}
