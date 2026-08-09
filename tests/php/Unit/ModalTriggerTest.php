<?php
/**
 * Unit tests for laao_modal_opens_itself().
 *
 * @package LAAO
 */

namespace LAAO\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ModalTriggerTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();

		require_once __DIR__ . '/../../../inc/helpers.php';
	}

	/**
	 * Each way a modal can already have a way to open.
	 *
	 * @return array<string, array{string, bool, bool, bool}>
	 */
	public static function self_opening(): array {
		return array(
			'a block designated as the trigger' => array( 'abc-123', false, false, false ),
			'open on page load'                 => array( '', true, false, false ),
			'exit intent'                       => array( '', false, true, false ),
			'scroll depth'                      => array( '', false, false, true ),
			'several at once'                   => array( 'abc-123', true, true, true ),
		);
	}

	#[DataProvider( 'self_opening' )]
	public function test_default_button_is_suppressed_when_something_else_opens_it(
		string $trigger_block_id,
		bool $open_on_load,
		bool $exit_intent,
		bool $scroll_depth
	): void {
		$this->assertTrue(
			laao_modal_opens_itself( $trigger_block_id, $open_on_load, $exit_intent, $scroll_depth ),
			'A modal that already opens must not also render a button offering to open it.'
		);
	}

	public function test_default_button_renders_when_nothing_else_opens_the_modal(): void {
		// The button is the fallback that makes a modal reachable at all.
		// Without it and without a trigger, the modal could never be opened.
		$this->assertFalse( laao_modal_opens_itself( '', false, false, false ) );
	}

	public function test_open_on_page_load_alone_suppresses_the_button(): void {
		// The regression this was written for: openOnLoad was missing from the
		// condition, so a modal set to open on page load rendered a stray
		// "Open Modal" button beneath it.
		$this->assertTrue(
			laao_modal_opens_itself( '', true, false, false ),
			'openOnLoad must count as a trigger.'
		);
	}

	public function test_whitespace_only_trigger_block_id_is_not_a_trigger(): void {
		// An attribute cleared in the editor can be left as whitespace rather
		// than removed; treating it as a real trigger would suppress the button
		// and leave the modal with no way to open.
		$this->assertFalse( laao_modal_opens_itself( '   ', false, false, false ) );
	}
}
