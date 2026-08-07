/**
 * Modal block — Inspector controls.
 *
 * Extracted from edit.tsx to stay under the file-length cap. Pure settings UI
 * driven by the block attributes; editor-only (never shipped to the front end).
 *
 * @module src/blocks-interactivity/modal/inspector
 */

import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import {
  Button,
  Notice,
  PanelBody,
  RangeControl,
  SelectControl,
  TextControl,
  ToggleControl,
  Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { ModalAttributes } from './types';
import type { TriggerOption } from './hooks/useTriggerManagement';
import { copyTextFallback } from './utils/copyTextFallback';

interface ModalInspectorProps {
  attributes: ModalAttributes;
  setAttributes: (attrs: Partial<ModalAttributes>) => void;
  safePosition: string;
  isHighlightActive: boolean;
  safeTriggerBlockId: string;
  handleRefreshHighlight: () => void;
  isSelected: boolean;
  availableTriggers: TriggerOption[];
  handleTriggerBlockChange: (selectedBlockId: string) => void;
}

export function ModalInspector({
  attributes,
  setAttributes,
  safePosition,
  isHighlightActive,
  safeTriggerBlockId,
  handleRefreshHighlight,
  isSelected,
  availableTriggers,
  handleTriggerBlockChange,
}: ModalInspectorProps): JSX.Element {
  const {
    openOnLoad = false,
    modalId = '',
    triggerLabel = 'Open Modal',
    disableOverlay = false,
    enterAnimation = 'fade',
    exitAnimation = 'fade',
    animationDuration = 300,
    exitIntentTrigger = false,
    exitIntentReshowDays = 7,
    scrollDepthTrigger = false,
    scrollDepthPercent = 50,
    openOnLoadOnce = false,
    dialogMaxWidth = '',
    dialogPadding = '',
    dialogBorderRadius = '',
    overlayOpacity = 50,
    overlayBlur = 4,
    overlayColor = '',
    triggerVariant = 'outlined',
    triggerSize = 'md',
    triggerFullWidth = false,
    triggerBorderRadius = '',
    triggerBgColor = '',
    triggerTextColor = '',
    triggerHoverBgColor = '',
    triggerHoverTextColor = '',
    closeButtonPlacement = 'inside-top-right',
    closeButtonIcon = 'close',
    closeButtonSize = 'md',
    closeButtonVariant = 'ghost',
    closeButtonLabel = '',
    closeButtonColor = '',
    closeButtonBgColor = '',
    closeButtonHoverColor = '',
    closeButtonHoverBgColor = '',
  } = attributes;

  return (
    <InspectorControls>
      <PanelBody
        title={__('Modal Settings', 'laao')}
        initialOpen={true}
      >
        {/* Modal ID */}
        <TextControl
          label={__('Modal ID', 'laao')}
          value={modalId}
          onChange={value => setAttributes({ modalId: value })}
          help={__(
            'Unique identifier for this modal. Used to link triggers to this modal.',
            'laao'
          )}
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        {/* Position */}
        <SelectControl<string>
          label={__('Modal Position', 'laao')}
          value={safePosition}
          options={[
            { label: __('Center', 'laao'), value: 'center' },
            { label: __('Top Left', 'laao'), value: 'top-left' },
            {
              label: __('Top Right', 'laao'),
              value: 'top-right',
            },
            {
              label: __('Bottom Left', 'laao'),
              value: 'bottom-left',
            },
            {
              label: __('Bottom Right', 'laao'),
              value: 'bottom-right',
            },
            {
              label: __('Bottom Sheet', 'laao'),
              value: 'bottom',
            },
            { label: __('Top Drawer', 'laao'), value: 'top' },
            { label: __('Left Panel', 'laao'), value: 'left' },
            { label: __('Right Panel', 'laao'), value: 'right' },
          ]}
          onChange={value => setAttributes({ position: value })}
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        {/* Max width */}
        <TextControl
          label={__('Max Width', 'laao')}
          value={dialogMaxWidth}
          placeholder='40rem'
          onChange={value => setAttributes({ dialogMaxWidth: value })}
          help={__(
            'e.g. 40rem, 600px, 80vw. Leave empty for default (40rem).',
            'laao'
          )}
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        {/* Open on load */}
        <ToggleControl
          label={__('Open on Page Load', 'laao')}
          checked={openOnLoad}
          onChange={value => setAttributes({ openOnLoad: value })}
          help={__(
            'Automatically open the modal when the page loads.',
            'laao'
          )}
          __nextHasNoMarginBottom
        />

        {openOnLoad && (
          <ToggleControl
            label={__('Show Once Per Visitor', 'laao')}
            checked={openOnLoadOnce}
            onChange={value => setAttributes({ openOnLoadOnce: value })}
            help={__(
              "Don't reopen after the visitor has seen it once.",
              'laao'
            )}
            __nextHasNoMarginBottom
          />
        )}

        {/* Disable overlay */}
        <ToggleControl
          label={__('Disable Overlay', 'laao')}
          checked={disableOverlay}
          onChange={value => setAttributes({ disableOverlay: value })}
          help={__(
            'When enabled, the modal will not have a background overlay',
            'laao'
          )}
          __nextHasNoMarginBottom
        />

        {/* Exit intent trigger */}
        <ToggleControl
          label={__('Exit Intent Trigger', 'laao')}
          checked={exitIntentTrigger}
          onChange={value => setAttributes({ exitIntentTrigger: value })}
          help={__(
            'Open the modal when the visitor shows intent to leave the page (mouse leaving viewport on desktop, rapid scroll-up on mobile)',
            'laao'
          )}
          __nextHasNoMarginBottom
        />

        {exitIntentTrigger && (
          <RangeControl
            label={__('Re-show After (days)', 'laao')}
            value={exitIntentReshowDays}
            onChange={value => setAttributes({ exitIntentReshowDays: value })}
            min={1}
            max={90}
            step={1}
            help={__(
              'Days before showing the exit intent modal again to the same visitor.',
              'laao'
            )}
            __nextHasNoMarginBottom
          />
        )}

        {/* Scroll depth trigger */}
        <ToggleControl
          label={__('Scroll Depth Trigger', 'laao')}
          checked={scrollDepthTrigger}
          onChange={value => setAttributes({ scrollDepthTrigger: value })}
          help={__(
            'Open when the visitor scrolls to a percentage of the page. Works on all devices.',
            'laao'
          )}
          __nextHasNoMarginBottom
        />

        {scrollDepthTrigger && (
          <RangeControl
            label={__('Scroll Depth (%)', 'laao')}
            value={scrollDepthPercent}
            onChange={value => setAttributes({ scrollDepthPercent: value })}
            min={10}
            max={100}
            step={5}
            help={__(
              'Percentage of the page scrolled before the modal opens.',
              'laao'
            )}
            __nextHasNoMarginBottom
          />
        )}

        {/* Trigger block select */}
        <SelectControl<string>
          label={__('Trigger Block', 'laao')}
          value={safeTriggerBlockId}
          options={availableTriggers}
          onChange={handleTriggerBlockChange}
          help={__(
            'Select a block to trigger this modal',
            'laao'
          )}
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        {/* Show highlight status */}
        {isHighlightActive && safeTriggerBlockId && isSelected && (
          <Notice status='info' isDismissible={false}>
            {__(
              'Trigger block is highlighted in the editor',
              'laao'
            )}
          </Notice>
        )}

        {/* Show message when not selected */}
        {safeTriggerBlockId && !isSelected && (
          <Notice status='warning' isDismissible={false}>
            {__(
              'Select this modal to highlight the trigger block',
              'laao'
            )}
          </Notice>
        )}

        {/* Refresh highlight button */}
        {safeTriggerBlockId && (
          <Tooltip
            text={
              !isSelected
                ? __(
                    'Select the modal first to use this button',
                    'laao'
                  )
                : ''
            }
          >
            <div>
              <Button
                variant='secondary'
                onClick={handleRefreshHighlight}
                className='refresh-highlight-button'
                disabled={!isSelected}
              >
                {__('Refresh Highlight', 'laao')}
              </Button>
            </div>
          </Tooltip>
        )}

        {/* Trigger label (only if no block selected) */}
        {!safeTriggerBlockId && (
          <TextControl
            label={__('Trigger Button Label', 'laao')}
            value={triggerLabel}
            onChange={value => setAttributes({ triggerLabel: value })}
            __next40pxDefaultSize
            __nextHasNoMarginBottom
          />
        )}
      </PanelBody>

      {/* Manual connection panel */}
      <PanelBody
        title={__('Manual Connection', 'laao')}
        initialOpen={false}
      >
        <p>
          {__(
            'To connect any HTML element to this modal, add this class:',
            'laao'
          )}
        </p>
        {modalId && (
          <>
            <code className='modal-connection-code'>
              modal-trigger-{modalId}
            </code>
            <p className='modal-connection-example'>
              {__('Example:', 'laao')}
              <br />
              <code>{`<button type="button" class="modal-trigger-${modalId}">Open Modal</button>`}</code>
            </p>
            <Button
              variant='secondary'
              onClick={() => {
                const textToCopy = `modal-trigger-${modalId}`;
                // Check if the Clipboard API is available.
                if (
                  navigator &&
                  navigator.clipboard &&
                  navigator.clipboard.writeText
                ) {
                  navigator.clipboard.writeText(textToCopy).catch(() => {
                    // Fallback to textarea method if writeText fails.
                    copyTextFallback(textToCopy);
                  });
                } else {
                  // Fallback method using a temporary textarea.
                  copyTextFallback(textToCopy);
                }
              }}
            >
              {__('Copy to Clipboard', 'laao')}
            </Button>
          </>
        )}
      </PanelBody>

      {/* Animation panel */}
      <PanelBody
        title={__('Animation Settings', 'laao')}
        initialOpen={false}
      >
        {/* Enter animation */}
        <SelectControl<string>
          label={__('Enter Animation', 'laao')}
          value={enterAnimation}
          options={[
            { label: __('Fade', 'laao'), value: 'fade' },
            { label: __('Slide Up', 'laao'), value: 'slide-up' },
            {
              label: __('Slide Down', 'laao'),
              value: 'slide-down',
            },
            {
              label: __('Slide Left', 'laao'),
              value: 'slide-left',
            },
            {
              label: __('Slide Right', 'laao'),
              value: 'slide-right',
            },
            { label: __('Zoom In', 'laao'), value: 'zoom-in' },
            { label: __('Expand', 'laao'), value: 'expand' },
            { label: __('Recede', 'laao'), value: 'recede' },
            { label: __('Lift', 'laao'), value: 'lift' },
            { label: __('Spring', 'laao'), value: 'spring' },
            { label: __('Pop', 'laao'), value: 'pop' },
            { label: __('Warp', 'laao'), value: 'warp' },
            { label: __('Material', 'laao'), value: 'material' },
            { label: __('Float', 'laao'), value: 'float' },
            { label: __('Drift', 'laao'), value: 'drift' },
            { label: __('Flip Up', 'laao'), value: 'flip-up' },
            { label: __('Blur', 'laao'), value: 'blur' },
            { label: __('None', 'laao'), value: 'none' },
          ]}
          onChange={value => setAttributes({ enterAnimation: value })}
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        {/* Exit animation */}
        <SelectControl<string>
          label={__('Exit Animation', 'laao')}
          value={exitAnimation}
          options={[
            { label: __('Fade', 'laao'), value: 'fade' },
            { label: __('Slide Up', 'laao'), value: 'slide-up' },
            {
              label: __('Slide Down', 'laao'),
              value: 'slide-down',
            },
            {
              label: __('Slide Left', 'laao'),
              value: 'slide-left',
            },
            {
              label: __('Slide Right', 'laao'),
              value: 'slide-right',
            },
            { label: __('Zoom Out', 'laao'), value: 'zoom-out' },
            { label: __('Zoom In', 'laao'), value: 'zoom-in' },
            { label: __('Expand', 'laao'), value: 'expand' },
            { label: __('Recede', 'laao'), value: 'recede' },
            { label: __('Pop', 'laao'), value: 'pop' },
            {
              label: __('Flip Down', 'laao'),
              value: 'flip-down',
            },
            { label: __('Blur', 'laao'), value: 'blur' },
            { label: __('None', 'laao'), value: 'none' },
          ]}
          onChange={value => setAttributes({ exitAnimation: value })}
          help={__(
            'Drawers and sheets always exit off-screen regardless of this setting.',
            'laao'
          )}
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        {/* Animation Duration */}
        <RangeControl
          label={__('Animation Duration (ms)', 'laao')}
          value={animationDuration}
          onChange={value => setAttributes({ animationDuration: value })}
          min={100}
          max={1000}
          step={50}
          __nextHasNoMarginBottom
        />
      </PanelBody>

      {/* Close Button panel */}
      <PanelBody
        title={__('Close Button', 'laao')}
        initialOpen={false}
      >
        <SelectControl<string>
          label={__('Placement', 'laao')}
          value={closeButtonPlacement}
          options={[
            {
              label: __('Inside — Top Right', 'laao'),
              value: 'inside-top-right',
            },
            {
              label: __('Inside — Top Left', 'laao'),
              value: 'inside-top-left',
            },
            {
              label: __('Inside — Bottom Right', 'laao'),
              value: 'inside-bottom-right',
            },
            {
              label: __('Inside — Bottom Left', 'laao'),
              value: 'inside-bottom-left',
            },
            {
              label: __('Sticky — Top Right', 'laao'),
              value: 'sticky-top-right',
            },
            {
              label: __('Outside — Top Right', 'laao'),
              value: 'outside-top-right',
            },
            {
              label: __('Outside — Top Left', 'laao'),
              value: 'outside-top-left',
            },
            { label: __('Hidden', 'laao'), value: 'none' },
          ]}
          onChange={value => setAttributes({ closeButtonPlacement: value })}
          help={
            closeButtonPlacement === 'none'
              ? __(
                  'Modal closes via backdrop click or Escape only.',
                  'laao'
                )
              : closeButtonPlacement.startsWith('outside-')
                ? __(
                    'Button floats in the overlay corner, independent of the dialog.',
                    'laao'
                  )
                : undefined
          }
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        {closeButtonPlacement !== 'none' && (
          <>
            <SelectControl<string>
              label={__('Icon', 'laao')}
              value={closeButtonIcon}
              options={[
                {
                  label: __('Close (×)', 'laao'),
                  value: 'close',
                },
                {
                  label: __('Arrow Left (←)', 'laao'),
                  value: 'arrow-left',
                },
                {
                  label: __('Chevron Down (↓)', 'laao'),
                  value: 'chevron-down',
                },
                {
                  label: __('Text only', 'laao'),
                  value: 'text-only',
                },
              ]}
              onChange={value => setAttributes({ closeButtonIcon: value })}
              __next40pxDefaultSize
              __nextHasNoMarginBottom
            />

            <SelectControl<string>
              label={__('Size', 'laao')}
              value={closeButtonSize}
              options={[
                {
                  label: __('Small (32px)', 'laao'),
                  value: 'sm',
                },
                {
                  label: __('Medium (44px)', 'laao'),
                  value: 'md',
                },
                {
                  label: __('Large (56px)', 'laao'),
                  value: 'lg',
                },
              ]}
              onChange={value => setAttributes({ closeButtonSize: value })}
              __next40pxDefaultSize
              __nextHasNoMarginBottom
            />

            <SelectControl<string>
              label={__('Style', 'laao')}
              value={closeButtonVariant}
              options={[
                {
                  label: __('Ghost (transparent)', 'laao'),
                  value: 'ghost',
                },
                { label: __('Filled', 'laao'), value: 'filled' },
                {
                  label: __('Outlined', 'laao'),
                  value: 'outlined',
                },
              ]}
              onChange={value => setAttributes({ closeButtonVariant: value })}
              __next40pxDefaultSize
              __nextHasNoMarginBottom
            />

            <TextControl
              label={__('Label', 'laao')}
              value={closeButtonLabel}
              placeholder={__('e.g. Close', 'laao')}
              onChange={value => setAttributes({ closeButtonLabel: value })}
              help={__(
                'Optional visible text alongside the icon.',
                'laao'
              )}
              __next40pxDefaultSize
              __nextHasNoMarginBottom
            />
          </>
        )}
      </PanelBody>

      {closeButtonPlacement !== 'none' && (
        <PanelBody
          title={__('Close Button Colors', 'laao')}
          initialOpen={false}
        >
          <PanelColorSettings
            __experimentalIsRenderedInSidebar
            title=''
            colorSettings={[
              {
                value: closeButtonColor,
                onChange: (value: string | undefined) =>
                  setAttributes({ closeButtonColor: value ?? '' }),
                label: __('Icon / text color', 'laao'),
              },
              {
                value: closeButtonBgColor,
                onChange: (value: string | undefined) =>
                  setAttributes({ closeButtonBgColor: value ?? '' }),
                label: __('Background', 'laao'),
              },
              {
                value: closeButtonHoverColor,
                onChange: (value: string | undefined) =>
                  setAttributes({ closeButtonHoverColor: value ?? '' }),
                label: __('Hover icon / text color', 'laao'),
              },
              {
                value: closeButtonHoverBgColor,
                onChange: (value: string | undefined) =>
                  setAttributes({ closeButtonHoverBgColor: value ?? '' }),
                label: __('Hover background', 'laao'),
              },
            ]}
          />
        </PanelBody>
      )}

      {/* Trigger Button panel — only relevant when using the built-in trigger */}
      {!safeTriggerBlockId && (
        <PanelBody
          title={__('Trigger Button', 'laao')}
          initialOpen={false}
        >
          <SelectControl<string>
            label={__('Variant', 'laao')}
            value={triggerVariant}
            options={[
              {
                label: __('Outlined', 'laao'),
                value: 'outlined',
              },
              { label: __('Filled', 'laao'), value: 'filled' },
              { label: __('Ghost', 'laao'), value: 'ghost' },
              { label: __('Text', 'laao'), value: 'text' },
            ]}
            onChange={value => setAttributes({ triggerVariant: value })}
            __next40pxDefaultSize
            __nextHasNoMarginBottom
          />

          <SelectControl<string>
            label={__('Size', 'laao')}
            value={triggerSize}
            options={[
              {
                label: __('Small (32px)', 'laao'),
                value: 'sm',
              },
              {
                label: __('Medium (44px)', 'laao'),
                value: 'md',
              },
              {
                label: __('Large (52px)', 'laao'),
                value: 'lg',
              },
            ]}
            onChange={value => setAttributes({ triggerSize: value })}
            __next40pxDefaultSize
            __nextHasNoMarginBottom
          />

          <ToggleControl
            label={__('Full Width', 'laao')}
            checked={triggerFullWidth}
            onChange={value => setAttributes({ triggerFullWidth: value })}
            help={__(
              'Stretch the button to fill its container.',
              'laao'
            )}
            __nextHasNoMarginBottom
          />

          <TextControl
            label={__('Border Radius', 'laao')}
            value={triggerBorderRadius}
            placeholder='0.25rem'
            onChange={value => setAttributes({ triggerBorderRadius: value })}
            help={__(
              'e.g. 0.25rem, 9999px for pill. Leave empty for square.',
              'laao'
            )}
            __next40pxDefaultSize
            __nextHasNoMarginBottom
          />

          <PanelColorSettings
            __experimentalIsRenderedInSidebar
            title={__('Colors', 'laao')}
            colorSettings={[
              {
                value: triggerBgColor,
                onChange: (value: string | undefined) =>
                  setAttributes({ triggerBgColor: value ?? '' }),
                label: __('Background', 'laao'),
              },
              {
                value: triggerTextColor,
                onChange: (value: string | undefined) =>
                  setAttributes({ triggerTextColor: value ?? '' }),
                label: __('Text', 'laao'),
              },
              {
                value: triggerHoverBgColor,
                onChange: (value: string | undefined) =>
                  setAttributes({ triggerHoverBgColor: value ?? '' }),
                label: __('Hover background', 'laao'),
              },
              {
                value: triggerHoverTextColor,
                onChange: (value: string | undefined) =>
                  setAttributes({ triggerHoverTextColor: value ?? '' }),
                label: __('Hover text', 'laao'),
              },
            ]}
          />
        </PanelBody>
      )}

      {/* Modal Design panel */}
      <PanelBody
        title={__('Modal Design', 'laao')}
        initialOpen={false}
      >
        <p className='components-base-control__help' style={{ marginTop: 0 }}>
          {__(
            'Use theme color presets for automatic light/dark mode adaptation.',
            'laao'
          )}
        </p>

        <TextControl
          label={__('Padding', 'laao')}
          value={dialogPadding}
          placeholder='1.5rem'
          onChange={value => setAttributes({ dialogPadding: value })}
          help={__(
            'e.g. 1.5rem, 1.5rem 2rem. Leave empty for the system default (1.5rem). Use 0 for flush content.',
            'laao'
          )}
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        <TextControl
          label={__('Border Radius', 'laao')}
          value={dialogBorderRadius}
          placeholder='var(--laao-radius-panel)'
          onChange={value => setAttributes({ dialogBorderRadius: value })}
          help={__(
            'Overrides the panel radius / Border panel. Leave empty for the system panel radius.',
            'laao'
          )}
          __next40pxDefaultSize
          __nextHasNoMarginBottom
        />

        <RangeControl
          label={__('Overlay Opacity (%)', 'laao')}
          value={overlayOpacity}
          onChange={value => setAttributes({ overlayOpacity: value })}
          min={0}
          max={90}
          step={5}
          help={__('Darkness of the backdrop overlay.', 'laao')}
          __nextHasNoMarginBottom
        />

        <RangeControl
          label={__('Overlay Blur (px)', 'laao')}
          value={overlayBlur}
          onChange={value => setAttributes({ overlayBlur: value })}
          min={0}
          max={20}
          step={1}
          help={__(
            'Backdrop blur behind the overlay. Set to 0 to disable.',
            'laao'
          )}
          __nextHasNoMarginBottom
        />

        <PanelColorSettings
          __experimentalIsRenderedInSidebar
          title={__('Overlay Color', 'laao')}
          colorSettings={[
            {
              value: overlayColor,
              onChange: (value: string | undefined) =>
                setAttributes({ overlayColor: value ?? '' }),
              label: __('Backdrop color', 'laao'),
            },
          ]}
        />
      </PanelBody>
    </InspectorControls>
  );
}
