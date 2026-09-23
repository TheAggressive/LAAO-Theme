<?php
/**
 * Unit tests for legacy modal saved-content markup.
 *
 * @package LAAO
 */

namespace LAAO\Tests\Unit;

use PHPUnit\Framework\TestCase;

class ModalContentTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();

		require_once __DIR__ . '/../../../inc/helpers.php';
	}

	public function test_legacy_modal_wrapper_is_removed(): void {
		$content = <<<'HTML'
<div style="border-width:24px" class="wp-block-laao-modal has-border-color">
	<div class="wp-block-group"><p>Modal content</p></div>
</div>
HTML;

		$this->assertSame(
			"\n\t<div class=\"wp-block-group\"><p>Modal content</p></div>\n",
			laao_unwrap_modal_saved_content( $content )
		);
	}

	public function test_nested_content_is_not_truncated(): void {
		$content = '<div class="wp-block-laao-modal"><div><div>Deep content</div></div></div>';

		$this->assertSame(
			'<div><div>Deep content</div></div>',
			laao_unwrap_modal_saved_content( $content )
		);
	}

	public function test_unrelated_content_is_unchanged(): void {
		$content = '<div class="wp-block-group"><p>Content</p></div>';

		$this->assertSame( $content, laao_unwrap_modal_saved_content( $content ) );
	}

	public function test_similarly_named_class_is_not_unwrapped(): void {
		$content = '<div class="wp-block-laao-modal__dialog"><p>Content</p></div>';

		$this->assertSame( $content, laao_unwrap_modal_saved_content( $content ) );
	}
}
