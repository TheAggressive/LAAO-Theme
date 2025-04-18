<?php
/**
 * Title: What's Hot Post Card
 * Slug: laao/post-whats-hot
 * Categories: posts
 * Block Types: core/query
 */
?>
<!-- wp:query {"queryId":7,"query":{"perPage":4,"pages":0,"offset":0,"postType":"posts","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false,"parents":[],"format":[]}} -->
<div class="wp-block-query"><!-- wp:post-template {"layout":{"type":"grid","columnCount":4}} -->
<!-- wp:post-featured-image /-->
<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"core/post-meta","args":{"key":"wh_link_to"}}}}} -->
<p></p>
<!-- /wp:paragraph -->
<!-- /wp:post-template -->

<!-- wp:query-no-results -->
<!-- wp:paragraph {"placeholder":"Add text or blocks that will display when a query returns no results."} -->
<p></p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results -->

</div>
<!-- /wp:query -->
