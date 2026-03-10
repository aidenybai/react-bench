"use client";
import React, { useState } from "react";

import { StyledCard } from "@/components/styled/styled-card";
import { StyledButton } from "@/components/styled/styled-button";
import { StyledBadge } from "@/components/styled/styled-badge";
import { StyledSection, StyledGrid } from "@/components/styled/styled-layout";
import { StyledAvatar } from "@/components/styled/styled-avatar";
import { StyledDataCell } from "@/components/styled/styled-data-cell";

import { RadixDialog } from "@/components/radix/radix-dialog";
import { RadixDropdown } from "@/components/radix/radix-dropdown";
import { RadixTabs } from "@/components/radix/radix-tabs";
import { RadixPopover } from "@/components/radix/radix-popover";
import { RadixAccordion } from "@/components/radix/radix-accordion";

import { AnimatedCard } from "@/components/motion/animated-card";
import { AnimatedList } from "@/components/motion/animated-list";
import { AnimatedModal } from "@/components/motion/animated-modal";
import { AnimatedTabs } from "@/components/motion/animated-tabs";
import { StaggerGrid } from "@/components/motion/stagger-grid";

import { RecursiveTree } from "@/components/recursive/recursive-tree";
import { RecursiveMenu } from "@/components/recursive/recursive-menu";
import { FractalLayout } from "@/components/recursive/fractal-layout";

import { MemoWrapper } from "@/components/wrappers/memo-wrapper";
import { ForwardRefWrapper } from "@/components/wrappers/forward-ref-wrapper";
import { FragmentTree } from "@/components/wrappers/fragment-tree";
import { SuspenseLazyLoader } from "@/components/wrappers/suspense-lazy-loader";

import { DynamicRenderer } from "@/components/computed/dynamic-renderer";
import { ConditionalTree } from "@/components/computed/conditional-tree";

import { withTracking } from "@/components/hoc/with-tracking";
import { withTooltip } from "@/components/hoc/with-tooltip";

import { TwCard } from "@/components/tailwind/tw-card";
import { TwButton } from "@/components/tailwind/tw-button";
import { TwBadge } from "@/components/tailwind/tw-badge";
import { TwDashboard } from "@/components/tailwind/tw-dashboard";
import { TwNav } from "@/components/tailwind/tw-nav";

import { ModuleCard } from "@/components/modules/module-card";
import { ModuleNav } from "@/components/modules/module-nav";
import { ModuleTable } from "@/components/modules/module-table";
import { ModuleAccordion } from "@/components/modules/module-accordion";

import { InlineCard } from "@/components/mixed/inline-card";
import { InlineList } from "@/components/mixed/inline-list";
import { StyleClash } from "@/components/mixed/style-clash";
import { TwStyledHybrid } from "@/components/mixed/tw-styled-hybrid";
import { ModuleTwHybrid } from "@/components/mixed/module-tw-hybrid";
import { InlineMotionHybrid } from "@/components/mixed/inline-motion-hybrid";

import { ShadcnProfileCard } from "@/components/shadcn/shadcn-profile-card";
import { ShadcnForm } from "@/components/shadcn/shadcn-form";
import { ShadcnDataDisplay } from "@/components/shadcn/shadcn-data-display";

import { TheGauntlet } from "@/components/challenge/the-gauntlet";
import { RussianDoll } from "@/components/challenge/russian-doll";
import { PortalInception } from "@/components/challenge/portal-inception";
import { AnimationMaze } from "@/components/challenge/animation-maze";
import { IdentityCrisis } from "@/components/challenge/identity-crisis";
import { Shapeshifter } from "@/components/challenge/shapeshifter";

import { createWidget } from "@/lib/create-widget";
import { ConfirmDialogContent } from "@/hooks/use-confirm-dialog";
import { NotificationStatusBadge } from "@/components/providers/notification-provider";
import { PrimaryAction } from "@/components/core/interactive/primary-action";
import { ConfirmBookingButton } from "@/components/features/booking/actions/confirm-booking-button";
import { DisplayNameField } from "@/components/features/settings/profile/fields/display-name-field";
import { MetricChart } from "@/components/features/analytics/charts/metric-chart";
import { RichTextBlock } from "@/components/features/editor/blocks/rich-text-block";
import { SystemBanner } from "@/components/features/notifications/banners/system-banner";
import { StatusIndicator } from "@/lib/render-utils";
import { FormattedCurrency } from "@/lib/data-formatters";
import { IntegrationCard } from "@/components/generated/integration-registry";

import { SubmitButton } from "@/components/actions/submit-action";
import { MetricCard } from "@/components/data-display/metric-overview";
import { ValidatedInput } from "@/components/forms/validated-input";
import { RouteLink } from "@/components/navigation/route-handler";
import { SessionAvatar } from "@/components/auth/session-indicator";
import { ProcessTag } from "@/components/feedback/process-monitor";
import { FeatureToggle } from "@/components/settings/feature-flag";
import { KpiCell } from "@/components/dashboard/kpi-tracker";
import { InterruptDialog } from "@/components/overlays/interrupt-handler";
import { SegmentButton } from "@/components/ui/segmented-control";
import { HoverTip } from "@/components/primitives/hover-context";
import { ContentDivider } from "@/components/layout/content-separator";
import { RemovableToken } from "@/components/atoms/removable-token";
import { PathSegment } from "@/components/navigation/path-trail";
import { AsyncSpinner } from "@/components/feedback/async-boundary";

import { createAction } from "@/lib/create-action";
import { createDisplay } from "@/lib/create-display";
import { createField } from "@/lib/create-field";

import { WizardStep } from "@/hooks/use-wizard";
import { ProgressRing } from "@/lib/progress-helpers";
import { ColorSwatch } from "@/lib/color-swatch";
import { DiffLine } from "@/lib/diff-renderer";
import { TimelineDot } from "@/lib/timeline-utils";
import { ThemePreview } from "@/components/providers/theme-swatch";
import { AuthBadge } from "@/components/providers/auth-status";
import { PaginationNav } from "@/hooks/use-page-nav";
import { ToastMessage } from "@/hooks/use-toast-queue";
import { EmptyState } from "@/lib/placeholder-utils";

import { BaseButton } from "@/components/primitives/base-button";
import { BaseInput } from "@/components/primitives/base-input";
import { BaseBadge } from "@/components/primitives/base-badge";
import { ReceiptLineItem } from "@/components/features/payments/receipt/line-item";
import { ThreadBubble } from "@/components/features/messaging/threads/thread-bubble";

import {
  RevenueStatCard,
  OrderStatCard,
  ChurnStatCard,
  RetentionStatCard,
  MrrStatCard,
} from "@/components/data-display/stat-cards";

import { OverlayBanner } from "@/components/portals/overlay-stack";
import { NotificationToast } from "@/components/portals/notification-portal";

import { DynamicWidget } from "@/components/generated/widget-registry";

import { ShippingLabel } from "@/components/features/orders/shipping/labels/shipping-label";
import { InvoiceRow } from "@/components/features/billing/invoices/rows/invoice-row";
import { PermissionChip } from "@/components/features/admin/roles/permissions/permission-chip";
import { LogEntry } from "@/components/features/monitoring/logs/entries/log-entry";
import { PipelineStage } from "@/components/features/ci/pipelines/stages/pipeline-stage";

import { IconLabel } from "@/components/common/icon-label";
import { StatusDot } from "@/components/common/status-dot";
import { KeyValue } from "@/components/common/key-value";

import { PrimitiveCard } from "@/lib/ui-primitives";
import { ActionSheetButton } from "@/hooks/use-action-sheet";
import { ConfigList } from "@/lib/layout-config";

import { createAlert } from "@/lib/create-alert";
import { createBadge } from "@/lib/create-badge";
import { createCard } from "@/lib/create-card";
import { createTab } from "@/lib/create-tab";

import { DragHandle } from "@/hooks/use-drag-drop";
import { ResizeGrip } from "@/hooks/use-resizable";
import { ShortcutHint } from "@/hooks/use-keyboard-shortcuts";
import { UndoToast } from "@/hooks/use-undo-stack";
import { ClipboardFeedback } from "@/hooks/use-clipboard-copy";
import { MarkdownPreview } from "@/lib/markdown-utils";
import { JsonTree } from "@/lib/json-inspector";
import { ByteDisplay } from "@/lib/byte-formatters";
import { DurationLabel } from "@/lib/duration-utils";
import { TruncatedText } from "@/lib/text-helpers";
import { CodeBlock } from "@/lib/syntax-utils";
import { RelativeTime } from "@/lib/date-helpers";
import { AvatarStack } from "@/lib/avatar-utils";
import { LocaleLabel } from "@/components/providers/locale-display";
import { FeatureFlagBadge } from "@/components/providers/feature-flag-display";
import { ConnectivityDot } from "@/components/providers/connectivity-display";
import { SkeletonBlock } from "@/lib/skeleton-config";
import { ErrorFallback } from "@/lib/error-config";
import { EmptyIllustration } from "@/lib/empty-state-config";
import { HotkeyLabel } from "@/lib/hotkey-registry";
import { PermissionGate } from "@/lib/permission-utils";
import { ScrollIndicator } from "@/lib/scroll-indicator";
import { CopyButton } from "@/lib/clipboard-helpers";
import { ExternalLink } from "@/lib/link-utils";
import { CountBadge } from "@/lib/counter-utils";

import { ProgressTracker } from "@/components/feedback/progress-tracker";
import { NotificationBox } from "@/components/feedback/notification-box";
import { ActionMenu } from "@/components/overlays/action-menu";
import { InfoPanel } from "@/components/overlays/info-panel";
import { ContentEditor } from "@/components/forms/content-editor";
import { AgreementCheck } from "@/components/forms/agreement-check";
import { PlanSelector } from "@/components/forms/plan-selector";
import { RangePicker } from "@/components/forms/range-picker";
import { CalendarEntry } from "@/components/data-display/calendar-entry";
import { MetricBar } from "@/components/data-display/metric-bar";
import { RecordRow } from "@/components/data-display/record-row";
import { ItemTile } from "@/components/data-display/item-tile";
import { ToolTrigger } from "@/components/actions/tool-trigger";
import { RedirectAction } from "@/components/actions/redirect-action";
import { CommandItem } from "@/components/navigation/command-item";
import { DrawerEntry } from "@/components/navigation/drawer-entry";
import { PageFooter } from "@/components/layout/page-footer";
import { TitleStrip } from "@/components/layout/title-strip";
import { PanelActions } from "@/components/layout/panel-actions";
import { SourcePreview } from "@/components/data-display/source-preview";
import { DocumentIcon } from "@/components/data-display/document-icon";
import { MilestoneDot } from "@/components/feedback/milestone-dot";
import { SnackMessage } from "@/components/feedback/snack-message";
import { DecisionPrompt } from "@/components/overlays/decision-prompt";
import { SlidePanel } from "@/components/overlays/slide-panel";
import { LabelGroup } from "@/components/data-display/label-group";
import { BinaryToggle } from "@/components/forms/binary-toggle";
import { OptionPicker } from "@/components/forms/option-picker";
import { DropTarget } from "@/components/forms/drop-target";
import { QueryInput } from "@/components/navigation/query-input";

import { CpuTile, RamTile, DiskTile, NetworkTile, GpuTile } from "@/components/data-display/metric-tiles";
import { CreateButton, ReadButton, UpdateButton, DeleteButton } from "@/components/actions/crud-buttons";
import { OnlineIndicator, OfflineIndicator, BusyIndicator, AwayIndicator, DndIndicator } from "@/components/feedback/status-indicators";
import { HomeIcon, SettingsIcon, ProfileIcon, HelpIcon, LogoutIcon, SearchIcon } from "@/components/navigation/nav-icons";

import { DynamicIcon } from "@/components/generated/icon-registry";
import { DynamicLayout } from "@/components/generated/layout-registry";

import { RefundButton } from "@/components/features/billing/refunds/actions/refund-button";
import { SubscriptionBadge } from "@/components/features/billing/subscriptions/status/subscription-badge";
import { CouponInput } from "@/components/features/billing/coupons/forms/coupon-input";
import { TaxLine } from "@/components/features/billing/taxes/display/tax-line";
import { RoleSelector } from "@/components/features/admin/users/roles/role-selector";
import { AuditRow } from "@/components/features/admin/audit/entries/audit-row";
import { WebhookCard } from "@/components/features/integrations/webhooks/cards/webhook-card";
import { ApiKeyRow } from "@/components/features/integrations/api-keys/display/api-key-row";
import { TemplatePreview } from "@/components/features/messaging/templates/preview/template-preview";
import { ChannelBadge } from "@/components/features/messaging/channels/badges/channel-badge";
import { FilterChip } from "@/components/features/search/filters/chips/filter-chip";
import { SortButton } from "@/components/features/search/sorting/controls/sort-button";
import { StepIndicator } from "@/components/features/onboarding/wizard/steps/step-indicator";
import { ChecklistItem } from "@/components/features/onboarding/checklist/items/checklist-item";
import { CronDisplay } from "@/components/features/scheduling/cron/display/cron-display";
import { CalendarCell } from "@/components/features/scheduling/calendar/cells/calendar-cell";
import { DiffHeader } from "@/components/features/versioning/diffs/headers/diff-header";
import { CommitMessage } from "@/components/features/versioning/commits/display/commit-message";
import { TagInput } from "@/components/features/content/tags/inputs/tag-input";
import { MediaThumb } from "@/components/features/content/media/thumbnails/media-thumb";
import { EnvVarRow } from "@/components/features/deployments/config/env-vars/env-var-row";
import { BuildStatus } from "@/components/features/deployments/builds/status/build-status";
import { MetricSparkline } from "@/components/features/analytics/metrics/sparklines/metric-sparkline";
import { FunnelStep } from "@/components/features/analytics/funnels/steps/funnel-step";
import { SegmentPill } from "@/components/features/analytics/segments/pills/segment-pill";
import { CommentBubble } from "@/components/features/collaboration/comments/bubbles/comment-bubble";
import { ReactionChip } from "@/components/features/collaboration/reactions/chips/reaction-chip";
import { MentionTag } from "@/components/features/collaboration/mentions/tags/mention-tag";
import { ApprovalButton } from "@/components/features/workflows/approvals/actions/approval-button";
import { ConditionRow } from "@/components/features/workflows/conditions/rows/condition-row";

const SaveAction = createAction({ label: "Save", icon: "💾", testId: "factory-save-action" });
const DeleteAction = createAction({ label: "Delete", icon: "🗑", testId: "factory-delete-action" });
const ShareAction = createAction({ label: "Share", icon: "📤", testId: "factory-share-action" });
const ExportAction = createAction({ label: "Export", icon: "📊", testId: "factory-export-action" });
const ArchiveAction = createAction({ label: "Archive", icon: "📦", testId: "factory-archive-action" });

const ConversionDisplay = createDisplay({ title: "Conversion Rate", format: "percent", testId: "factory-conversion-rate" });
const BounceDisplay = createDisplay({ title: "Bounce Rate", format: "percent", testId: "factory-bounce-rate" });
const SalesDisplay = createDisplay({ title: "Total Sales", format: "currency", testId: "factory-total-sales" });
const SessionDisplay = createDisplay({ title: "Avg Session", format: "number", testId: "factory-avg-session" });
const ErrorDisplay = createDisplay({ title: "Error Count", format: "number", testId: "factory-error-count" });

const SearchField = createField({ label: "Search", placeholder: "Search...", testId: "factory-search-field" });
const EmailField = createField({ label: "Email", placeholder: "you@example.com", testId: "factory-email-field" });
const PhoneField = createField({ label: "Phone", placeholder: "+1 (555) 000-0000", testId: "factory-phone-field" });
const UrlField = createField({ label: "URL", placeholder: "https://...", testId: "factory-url-field" });
const NotesField = createField({ label: "Notes", placeholder: "Add notes...", testId: "factory-notes-field" });

const RevenueWidget = createWidget({
  title: "Revenue",
  icon: "$",
  testId: "factory-revenue-widget",
});
const UsersWidget = createWidget({
  title: "Active Users",
  icon: "U",
  testId: "factory-users-widget",
});

const InfoAlert = createAlert({ severity: "info", testId: "factory-info-alert" });
const WarningAlert = createAlert({ severity: "warning", testId: "factory-warning-alert" });
const ErrorAlert = createAlert({ severity: "error", testId: "factory-error-alert" });
const SuccessAlert = createAlert({ severity: "success", testId: "factory-success-alert" });

const StatusBadge = createBadge({ variant: "status", testId: "factory-status-badge" });
const PriorityBadge = createBadge({ variant: "priority", testId: "factory-priority-badge" });
const RoleBadge = createBadge({ variant: "role", testId: "factory-role-badge" });
const VersionBadge = createBadge({ variant: "version", testId: "factory-version-badge" });
const EnvBadge = createBadge({ variant: "environment", testId: "factory-env-badge" });

const UptimeCard = createCard({ title: "Uptime", icon: "⬆", testId: "factory-uptime-card" });
const LatencyCard = createCard({ title: "Latency", icon: "⏱", testId: "factory-latency-card" });
const ThroughputCard = createCard({ title: "Throughput", icon: "📈", testId: "factory-throughput-card" });
const MemoryCard = createCard({ title: "Memory", icon: "💾", testId: "factory-memory-card" });
const CpuCard = createCard({ title: "CPU", icon: "🔥", testId: "factory-cpu-card" });
const DiskCard = createCard({ title: "Disk", icon: "💿", testId: "factory-disk-card" });

const OverviewTab = createTab({ label: "Overview", testId: "factory-overview-tab" });
const DetailsTab = createTab({ label: "Details", testId: "factory-details-tab" });
const HistoryTab = createTab({ label: "History", testId: "factory-history-tab" });
const SettingsTab = createTab({ label: "Settings", testId: "factory-settings-tab" });
const LogsTab = createTab({ label: "Logs", testId: "factory-logs-tab" });

const TrackedCard = withTracking(StyledCard, "tracked-card");
const MemoForwardRefButton = withTooltip(
  StyledButton,
  "Memo + ForwardRef Button",
);

export function ClientBenchmarks() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
        React Grab Benchmark
      </h1>
      <p style={{ color: "var(--muted-foreground)", marginBottom: 32 }}>
        Deeply nested Next.js app with styled-components, Tailwind, CSS Modules,
        shadcn/ui, inline styles, motion, Radix UI, recursive components, HOCs,
        portals, fragments, and suspense.
      </p>

      <StyledSection title="Easy: Baselines">
        <StyledGrid columns={3}>
          <StyledCard title="Simple Card" data-testid="plain-styled-card">
            A plain styled card with no wrapping complexity.
          </StyledCard>

          <div>
            <StyledButton data-testid="plain-styled-button">
              Simple Button
            </StyledButton>
          </div>

          <div>
            <StyledBadge data-testid="plain-styled-badge">New</StyledBadge>
          </div>

          <RadixTabs
            data-testid="plain-radix-tabs"
            tabs={[
              {
                value: "tab1",
                label: "Tab 1",
                content: <div>Tab 1 content</div>,
                testId: "radix-tabs-trigger",
              },
              {
                value: "tab2",
                label: "Tab 2",
                content: <div>Tab 2 content</div>,
              },
            ]}
          />

          <AnimatedCard data-testid="plain-animated-card">
            Simple animated card
          </AnimatedCard>

          <div data-testid="provider-child">
            Content rendered inside 6 providers
          </div>

          <TwCard title="Tailwind Card" data-testid="plain-tw-card">
            Pure Tailwind utility classes, no other styling.
          </TwCard>

          <div>
            <TwButton data-testid="plain-tw-button">Tailwind Button</TwButton>
          </div>

          <div>
            <TwBadge data-testid="plain-tw-badge" color="blue">
              Tailwind
            </TwBadge>
          </div>

          <ModuleCard title="Module Card" data-testid="plain-module-card">
            CSS Modules scoped styles.
          </ModuleCard>

          <InlineCard title="Inline Card" data-testid="plain-inline-card">
            Pure inline React styles, zero class names.
          </InlineCard>

          <ShadcnProfileCard data-testid="shadcn-profile-card" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Medium: Moderate Nesting">
        <StyledGrid columns={2}>
          <TrackedCard title="Tracked Card" data-testid="tracked-styled-card">
            Card wrapped in withTracking HOC
          </TrackedCard>

          <div>
            <MemoForwardRefButton
              data-testid="memo-forwardref-button"
              variant="secondary"
            >
              Memo+Ref Button
            </MemoForwardRefButton>
          </div>

          <RadixDialog
            triggerLabel="Open Dialog"
            title="Benchmark Dialog"
            description="This dialog renders via a portal"
            data-testid="radix-dialog-trigger"
          >
            <p>Dialog content here</p>
          </RadixDialog>

          <RadixDropdown
            triggerLabel="Actions"
            data-testid="radix-dropdown-trigger"
            items={[
              { label: "Edit", testId: "radix-dropdown-item" },
              { label: "Delete" },
              { label: "Share" },
            ]}
          />

          <RadixAccordion
            data-testid="radix-accordion"
            items={[
              {
                value: "item1",
                title: "Section 1",
                content: (
                  <div data-testid="radix-accordion-content">
                    Accordion content panel
                  </div>
                ),
                testId: "radix-accordion-trigger",
              },
              {
                value: "item2",
                title: "Section 2",
                content: <div>More content</div>,
              },
            ]}
          />

          <AnimatedList
            data-testid="animated-list"
            items={[
              { id: "1", content: "First item" },
              {
                id: "2",
                content: "Second item",
                testId: "animated-list-item",
              },
              { id: "3", content: "Third item" },
            ]}
          />

          <RadixPopover
            triggerLabel="Open Popover"
            data-testid="radix-popover-trigger"
          >
            <div data-testid="radix-popover-content">Popover content here</div>
          </RadixPopover>

          <FragmentTree>
            <StyledAvatar initials="AB" data-testid="fragment-tree-avatar" />
          </FragmentTree>

          <SuspenseLazyLoader data-testid="suspense-lazy-content" />

          <StaggerGrid
            data-testid="stagger-grid"
            columns={3}
            items={[
              { id: "g1", content: "Grid 1" },
              { id: "g2", content: "Grid 2", testId: "stagger-grid-child" },
              { id: "g3", content: "Grid 3" },
              { id: "g4", content: "Grid 4" },
              { id: "g5", content: "Grid 5" },
              { id: "g6", content: "Grid 6" },
            ]}
          />

          <RadixTabs
            tabs={[
              {
                value: "panel1",
                label: "Panel A",
                content: (
                  <div data-testid="radix-tabs-panel-content">
                    Tab panel content
                  </div>
                ),
              },
              {
                value: "panel2",
                label: "Panel B",
                content: <div>Panel B content</div>,
              },
            ]}
          />

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <StyledDataCell
                  label="Revenue"
                  sub="Q4 2025"
                  data-testid="styled-data-cell"
                />
                <StyledDataCell label="$1.2M" sub="+12%" />
              </tr>
            </tbody>
          </table>

          <TwDashboard data-testid="tw-dashboard" />
          <TwNav data-testid="tw-nav" />

          <ModuleTable data-testid="module-table" />
          <ModuleNav data-testid="module-nav" />
          <ModuleAccordion
            data-testid="module-accordion"
            items={[
              {
                id: "ma1",
                title: "What is CSS Modules?",
                content: "CSS Modules scope styles locally by default.",
              },
              {
                id: "ma2",
                title: "How does it work?",
                content: "Class names are transformed at build time.",
              },
              {
                id: "ma3",
                title: "Why use it?",
                content: "Prevents style collisions in large apps.",
              },
            ]}
          />

          <InlineList
            data-testid="inline-list"
            items={[
              {
                id: "1",
                label: "Feature A",
                description: "Core functionality",
                tag: "New",
              },
              {
                id: "2",
                label: "Feature B",
                description: "Enhancement",
                tag: "Beta",
              },
              { id: "3", label: "Feature C", description: "Experimental" },
            ]}
          />

          <ShadcnForm data-testid="shadcn-form" />
          <ShadcnDataDisplay data-testid="shadcn-data-display" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Hard: Deep Nesting">
        <StyledGrid columns={2}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Recursive Tree (depth=8, 256 leaves)
            </h3>
            <RecursiveTree depth={8} data-testid="recursive-tree" />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Recursive Menu (10 levels)
            </h3>
            <RecursiveMenu depth={10} data-testid="recursive-menu" />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Fractal Layout
            </h3>
            <FractalLayout depth={4} data-testid="fractal-layout" />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              HOC + Motion + Styled
            </h3>
            <MemoWrapper>
              <ForwardRefWrapper>
                <AnimatedCard data-testid="hoc-motion-styled-card">
                  HOC-wrapped motion card inside styled layout
                </AnimatedCard>
              </ForwardRefWrapper>
            </MemoWrapper>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Tooltip + HOC + Styled
            </h3>
            <MemoForwardRefButton
              data-testid="tooltip-hoc-styled-button"
              variant="ghost"
            >
              Hover for tooltip
            </MemoForwardRefButton>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Portal + Motion Modal
            </h3>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--background)",
                cursor: "pointer",
              }}
            >
              Open Motion Modal
            </button>
            <AnimatedModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              data-testid="portal-motion-modal"
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Motion Modal
              </h3>
              <p style={{ color: "var(--muted-foreground)", marginTop: 8 }}>
                This modal animates in via a portal
              </p>
            </AnimatedModal>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Dynamic Renderer
            </h3>
            <DynamicRenderer type="success" data-testid="dynamic-renderer" />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Conditional Tree
            </h3>
            <ConditionalTree
              seed="benchmark"
              depth={6}
              data-testid="conditional-tree"
            />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Animated Tabs
            </h3>
            <AnimatedTabs
              data-testid="animated-tabs"
              tabs={[
                {
                  id: "at1",
                  label: "Overview",
                  content: <div>Overview content</div>,
                },
                {
                  id: "at2",
                  label: "Details",
                  content: <div>Details content</div>,
                },
                {
                  id: "at3",
                  label: "Settings",
                  content: <div>Settings content</div>,
                },
              ]}
            />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Button in Dialog in Motion
            </h3>
            <RadixDialog
              triggerLabel="Open Nested"
              title="Nested Dialog"
              data-testid="nested-dialog-trigger"
            >
              <AnimatedCard>
                <StyledButton data-testid="button-in-dialog-in-motion">
                  Deep Button
                </StyledButton>
              </AnimatedCard>
            </RadixDialog>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Style Clash (4 methods on 1 element)
            </h3>
            <StyleClash data-testid="style-clash" />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Tailwind + styled-components Hybrid
            </h3>
            <TwStyledHybrid data-testid="tw-styled-hybrid" />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              CSS Modules + Tailwind Hybrid
            </h3>
            <ModuleTwHybrid data-testid="module-tw-hybrid" />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Inline + Motion Hybrid
            </h3>
            <InlineMotionHybrid data-testid="inline-motion-hybrid" />
          </div>
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Nightmare: Maximum Difficulty">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              The Gauntlet (~25 Fiber layers)
            </h3>
            <TheGauntlet />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Russian Doll (15+ HOC layers)
            </h3>
            <RussianDoll />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Portal Inception (3 nested portals)
            </h3>
            <PortalInception />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Animation Maze
            </h3>
            <AnimationMaze data-testid="animation-maze-content" />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Identity Crisis (same component, 6 depths)
            </h3>
            <IdentityCrisis />
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Shapeshifter (changes tree on render)
            </h3>
            <Shapeshifter data-testid="shapeshifter" />
          </div>
        </div>
      </StyledSection>

      <StyledSection title="Adversarial: Hidden Sources">
        <StyledGrid columns={2}>
          <RevenueWidget value="$1.2M" trend="+12.5%" />
          <UsersWidget value="8,421" trend="+3.2%" />

          <ConfirmDialogContent
            title="Delete Account"
            message="Are you sure? This action cannot be undone."
            onConfirm={() => {}}
            onCancel={() => {}}
          />

          <NotificationStatusBadge count={5} status="error" />

          <PrimaryAction variant="default" size="md">
            Primary Action
          </PrimaryAction>

          <ConfirmBookingButton
            bookingId="bk_abc123"
            onConfirm={() => Promise.resolve()}
          />

          <DisplayNameField initialValue="Aiden Bai" onChange={() => {}} />

          <MetricChart
            data={[
              { label: "Jan", value: 120 },
              { label: "Feb", value: 180 },
              { label: "Mar", value: 150 },
              { label: "Apr", value: 220 },
              { label: "May", value: 190 },
            ]}
            title="Monthly Revenue"
          />

          <RichTextBlock initialContent="Hello world" readOnly={true} />

          <SystemBanner
            message="System maintenance scheduled for March 20th, 2026."
            variant="warning"
            dismissible={true}
          />

          <StatusIndicator status="online" label="All systems operational" />

          <FormattedCurrency amount={1234.56} currency="USD" />

          <IntegrationCard slug="slack" connected={true} />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Search-Resistant: Generic Names">
        <StyledGrid columns={3}>
          <SubmitButton data-testid="generic-submit-button">Submit</SubmitButton>
          <MetricCard data-testid="generic-data-card">1,234</MetricCard>
          <ValidatedInput data-testid="generic-text-input" />
          <RouteLink data-testid="generic-nav-link">Dashboard</RouteLink>
          <SessionAvatar data-testid="generic-user-avatar" />
          <ProcessTag data-testid="generic-status-tag">Running</ProcessTag>
          <FeatureToggle data-testid="generic-toggle-switch" />
          <KpiCell data-testid="generic-grid-cell">98.5%</KpiCell>
          <InterruptDialog data-testid="generic-modal-dialog">Confirm?</InterruptDialog>
          <SegmentButton data-testid="generic-tab-button">Tab 1</SegmentButton>
          <HoverTip data-testid="generic-hover-tip">Hover info</HoverTip>
          <ContentDivider data-testid="generic-separator" />
          <RemovableToken data-testid="generic-token-chip">Tag</RemovableToken>
          <PathSegment data-testid="generic-path-crumb">Home</PathSegment>
          <AsyncSpinner data-testid="generic-loading-ring" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Search-Resistant: Factory Components">
        <StyledGrid columns={3}>
          <SaveAction />
          <DeleteAction />
          <ShareAction />
          <ExportAction />
          <ArchiveAction />
          <ConversionDisplay value={3.2} />
          <BounceDisplay value={42.1} />
          <SalesDisplay value={98765} />
          <SessionDisplay value={4.5} />
          <ErrorDisplay value={12} />
          <SearchField />
          <EmailField />
          <PhoneField />
          <UrlField />
          <NotesField />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Search-Resistant: Wrong Location">
        <StyledGrid columns={3}>
          <WizardStep label="Step 1" active={true} data-testid="hook-wizard-step" />
          <ProgressRing percent={72} data-testid="util-progress-ring" />
          <ColorSwatch color="#6366f1" data-testid="util-color-swatch" />
          <DiffLine line="const x = 1;" type="added" data-testid="util-diff-line" />
          <TimelineDot label="Deployed" active data-testid="util-timeline-dot" />
          <ThemePreview data-testid="provider-theme-preview" />
          <AuthBadge data-testid="provider-auth-badge" />
          <PaginationNav current={2} total={10} data-testid="hook-pagination-nav" />
          <ToastMessage message="Saved!" data-testid="hook-toast-message" />
          <EmptyState message="No items yet" data-testid="util-empty-state" />
          <PrimitiveCard data-testid="misleading-card-in-utils" />
          <ActionSheetButton data-testid="misleading-button-in-hooks" />
          <ConfigList data-testid="misleading-list-in-config" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Search-Resistant: Barrel Re-exports & Deep Paths">
        <StyledGrid columns={3}>
          <BaseButton data-testid="barrel-base-button">Click</BaseButton>
          <BaseInput label="Name" data-testid="barrel-base-input" />
          <BaseBadge data-testid="barrel-base-badge">New</BaseBadge>
          <ReceiptLineItem label="Item 1" amount={29.99} data-testid="deep-receipt-line-item" />
          <ThreadBubble text="Hey there!" sender="Alice" data-testid="deep-thread-bubble" />
          <ShippingLabel data-testid="deep-shipping-label" />
          <InvoiceRow data-testid="deep-invoice-row" />
          <PermissionChip data-testid="deep-permission-chip" />
          <LogEntry data-testid="deep-log-entry" />
          <PipelineStage data-testid="deep-pipeline-stage" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Search-Resistant: Ambiguous Siblings & Portals">
        <StyledGrid columns={3}>
          <RevenueStatCard data-testid="sibling-revenue-stat" />
          <OrderStatCard data-testid="sibling-order-stat" />
          <ChurnStatCard data-testid="sibling-churn-stat" />
          <RetentionStatCard data-testid="sibling-retention-stat" />
          <MrrStatCard data-testid="sibling-mrr-stat" />
          <OverlayBanner message="System update" data-testid="portal-overlay-banner" />
          <NotificationToast text="Changes saved" data-testid="portal-notification-toast" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Search-Resistant: Dynamic & Cross-Module">
        <StyledGrid columns={3}>
          <DynamicWidget size="small" data-testid="dynamic-small-widget" />
          <DynamicWidget size="medium" data-testid="dynamic-medium-widget" />
          <DynamicWidget size="large" data-testid="dynamic-large-widget" />
          <IconLabel icon="📧" text="Email" data-testid="common-icon-label" />
          <StatusDot status="online" data-testid="common-status-dot" />
          <KeyValue label="Version" value="2.1.0" data-testid="common-key-value" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Hard: More Factories">
        <StyledGrid columns={3}>
          <InfoAlert message="Information" />
          <WarningAlert message="Warning" />
          <ErrorAlert message="Error occurred" />
          <SuccessAlert message="Success!" />
          <StatusBadge label="Active" />
          <PriorityBadge label="High" />
          <RoleBadge label="Admin" />
          <VersionBadge label="v2.1" />
          <EnvBadge label="Production" />
          <UptimeCard value="99.9%" />
          <LatencyCard value="42ms" />
          <ThroughputCard value="1.2k/s" />
          <MemoryCard value="2.1GB" />
          <CpuCard value="34%" />
          <DiskCard value="67%" />
          <OverviewTab active />
          <DetailsTab />
          <HistoryTab />
          <SettingsTab />
          <LogsTab />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Hard: Deep Feature Paths">
        <StyledGrid columns={3}>
          <RefundButton data-testid="deep-refund-button" />
          <SubscriptionBadge data-testid="deep-subscription-badge" />
          <CouponInput data-testid="deep-coupon-input" />
          <TaxLine data-testid="deep-tax-line" />
          <RoleSelector data-testid="deep-role-selector" />
          <AuditRow data-testid="deep-audit-row" />
          <WebhookCard data-testid="deep-webhook-card" />
          <ApiKeyRow data-testid="deep-api-key-row" />
          <TemplatePreview data-testid="deep-template-preview" />
          <ChannelBadge data-testid="deep-channel-badge" />
          <FilterChip data-testid="deep-filter-chip" />
          <SortButton data-testid="deep-sort-button" />
          <StepIndicator data-testid="deep-step-indicator" />
          <ChecklistItem data-testid="deep-checklist-item" />
          <CronDisplay data-testid="deep-cron-display" />
          <CalendarCell data-testid="deep-calendar-cell" />
          <DiffHeader data-testid="deep-diff-header" />
          <CommitMessage data-testid="deep-commit-message" />
          <TagInput data-testid="deep-tag-input" />
          <MediaThumb data-testid="deep-media-thumb" />
          <EnvVarRow data-testid="deep-env-var-row" />
          <BuildStatus data-testid="deep-build-status" />
          <MetricSparkline data-testid="deep-metric-sparkline" />
          <FunnelStep data-testid="deep-funnel-step" />
          <SegmentPill data-testid="deep-segment-pill" />
          <CommentBubble data-testid="deep-comment-bubble" />
          <ReactionChip data-testid="deep-reaction-chip" />
          <MentionTag data-testid="deep-mention-tag" />
          <ApprovalButton data-testid="deep-approval-button" />
          <ConditionRow data-testid="deep-condition-row" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Hard: Wrong Location (Hooks/Utils/Providers)">
        <StyledGrid columns={3}>
          <DragHandle data-testid="hook-drag-handle" />
          <ResizeGrip data-testid="hook-resize-grip" />
          <ShortcutHint data-testid="hook-shortcut-hint" />
          <UndoToast data-testid="hook-undo-toast" />
          <ClipboardFeedback data-testid="hook-clipboard-feedback" />
          <MarkdownPreview data-testid="util-markdown-preview" />
          <JsonTree data-testid="util-json-tree" />
          <ByteDisplay data-testid="util-byte-display" />
          <DurationLabel data-testid="util-duration-label" />
          <TruncatedText data-testid="util-truncated-text" />
          <CodeBlock data-testid="util-code-block" />
          <RelativeTime data-testid="util-relative-time" />
          <AvatarStack data-testid="util-avatar-stack" />
          <LocaleLabel data-testid="provider-locale-label" />
          <FeatureFlagBadge data-testid="provider-feature-badge" />
          <ConnectivityDot data-testid="provider-connectivity-dot" />
          <SkeletonBlock data-testid="config-skeleton-block" />
          <ErrorFallback data-testid="config-error-fallback" />
          <EmptyIllustration data-testid="config-empty-illustration" />
          <HotkeyLabel data-testid="util-hotkey-label" />
          <PermissionGate data-testid="util-permission-gate" />
          <ScrollIndicator data-testid="util-scroll-indicator" />
          <CopyButton data-testid="util-copy-button" />
          <ExternalLink data-testid="util-external-link" />
          <CountBadge data-testid="util-count-badge" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Hard: Generic Names in Misleading Dirs">
        <StyledGrid columns={3}>
          <ProgressTracker data-testid="generic-progress-bar" />
          <NotificationBox data-testid="generic-alert-box" />
          <ActionMenu data-testid="generic-dropdown-menu" />
          <InfoPanel data-testid="generic-popover-panel" />
          <ContentEditor data-testid="generic-text-area" />
          <AgreementCheck data-testid="generic-checkbox" />
          <PlanSelector data-testid="generic-radio-option" />
          <RangePicker data-testid="generic-slider-range" />
          <CalendarEntry data-testid="generic-date-cell" />
          <MetricBar data-testid="generic-chart-bar" />
          <RecordRow data-testid="generic-table-row" />
          <ItemTile data-testid="generic-list-tile" />
          <ToolTrigger data-testid="generic-icon-button" />
          <RedirectAction data-testid="generic-link-button" />
          <CommandItem data-testid="generic-menu-item" />
          <DrawerEntry data-testid="generic-sidebar-link" />
          <PageFooter data-testid="generic-footer-text" />
          <TitleStrip data-testid="generic-header-bar" />
          <PanelActions data-testid="generic-card-footer" />
          <SourcePreview data-testid="generic-code-snippet" />
          <DocumentIcon data-testid="generic-file-icon" />
          <MilestoneDot data-testid="generic-step-circle" />
          <SnackMessage data-testid="generic-toast-bar" />
          <DecisionPrompt data-testid="generic-confirm-modal" />
          <SlidePanel data-testid="generic-drawer-sheet" />
          <LabelGroup data-testid="generic-tag-list" />
          <BinaryToggle data-testid="generic-switch-track" />
          <OptionPicker data-testid="generic-select-box" />
          <DropTarget data-testid="generic-upload-zone" />
          <QueryInput data-testid="generic-search-bar" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Hard: Ambiguous Siblings">
        <StyledGrid columns={3}>
          <CpuTile data-testid="sibling-cpu-tile" />
          <RamTile data-testid="sibling-ram-tile" />
          <DiskTile data-testid="sibling-disk-tile" />
          <NetworkTile data-testid="sibling-network-tile" />
          <GpuTile data-testid="sibling-gpu-tile" />
          <CreateButton data-testid="sibling-create-btn" />
          <ReadButton data-testid="sibling-read-btn" />
          <UpdateButton data-testid="sibling-update-btn" />
          <DeleteButton data-testid="sibling-delete-btn" />
          <OnlineIndicator data-testid="sibling-online-indicator" />
          <OfflineIndicator data-testid="sibling-offline-indicator" />
          <BusyIndicator data-testid="sibling-busy-indicator" />
          <AwayIndicator data-testid="sibling-away-indicator" />
          <DndIndicator data-testid="sibling-dnd-indicator" />
          <HomeIcon data-testid="sibling-home-icon" />
          <SettingsIcon data-testid="sibling-settings-icon" />
          <ProfileIcon data-testid="sibling-profile-icon" />
          <HelpIcon data-testid="sibling-help-icon" />
          <LogoutIcon data-testid="sibling-logout-icon" />
          <SearchIcon data-testid="sibling-search-icon" />
        </StyledGrid>
      </StyledSection>

      <StyledSection title="Hard: Dynamic Registries">
        <StyledGrid columns={3}>
          <DynamicIcon shape="circle" data-testid="dynamic-circle-icon" />
          <DynamicIcon shape="square" data-testid="dynamic-square-icon" />
          <DynamicIcon shape="triangle" data-testid="dynamic-triangle-icon" />
          <DynamicIcon shape="star" data-testid="dynamic-star-icon" />
          <DynamicIcon shape="diamond" data-testid="dynamic-diamond-icon" />
          <DynamicLayout variant="single" data-testid="dynamic-single-layout" />
          <DynamicLayout variant="two" data-testid="dynamic-two-layout" />
          <DynamicLayout variant="three" data-testid="dynamic-three-layout" />
          <DynamicLayout variant="sidebar" data-testid="dynamic-sidebar-layout" />
          <DynamicLayout variant="stacked" data-testid="dynamic-stacked-layout" />
        </StyledGrid>
      </StyledSection>
    </div>
  );
}
