<?php
/**
 * Title: Cover Post Query Loop Template
 * Slug: laao/cover-post-query-loop-template
 * Categories: query
 * Block Types: core/query, core/query-loop
 * Inserter: true
 * Description: A query loop pattern that displays cover posts in a grid layout
 */

?>
<!-- wp:query {"queryId":0,"query":{"perPage":1,"pages":0,"offset":0,"postType":"cover","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false,"parents":[],"format":[]},"metadata":{"categories":["posts"],"patternName":"laao/query-loop-posts","name":"Posts Query Loop"},"align":"wide"} -->
<div class="wp-block-query alignwide"><!-- wp:post-template {"align":"wide","layout":{"type":"default"}} -->
<!-- wp:group {"tagName":"article","className":"cover-article","backgroundColor":"laao-white","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<article class="wp-block-group cover-article has-laao-white-background-color has-background"><!-- wp:group {"className":"cover-article-media-container","style":{"layout":{"selfStretch":"fit","flexSize":null}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"top","flexWrap":"nowrap"}} -->
<div class="wp-block-group cover-article-media-container"><!-- wp:post-featured-image /-->

<!-- wp:group {"className":"cover-article-secondary-images","layout":{"type":"grid","columnCount":2,"minimumColumnWidth":null}} -->
<div class="wp-block-group cover-article-secondary-images"><!-- wp:laao/block-binding-image {"sizeSlug":"full"} /-->

<!-- wp:laao/block-binding-image {"metaKey":"photo_3","sizeSlug":"full"} /--></div>
<!-- /wp:group -->

<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"core/post-meta","args":{"key":"picture_id"}}}},"className":"cover-article-media-caption"} -->
<p class="cover-article-media-caption"></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"article-content","style":{"spacing":{"blockGap":"var:preset|spacing|12"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group article-content"><!-- wp:post-title {"className":"article-title","style":{"typography":{"fontStyle":"normal","fontWeight":"700","lineHeight":"1.5"}},"fontSize":"xxxxx-large","fontFamily":"roboto-condensed"} /-->

<!-- wp:group {"className":"social-share","layout":{"type":"flex","orientation":"horizontal"}} -->
<div class="wp-block-group social-share"><!-- wp:jetpack/sharing-buttons {"styleType":"icon","iconColor":"laao-red","iconColorValue":"hsl(0, 72.2%, 50.6%)","iconBackgroundColor":"laao-transparent","iconBackgroundColorValue":"hsla(0, 0%, 0%, 0)","style":{"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"blockGap":{"left":"0"}}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<ul class="wp-block-jetpack-sharing-buttons has-normal-icon-size jetpack-sharing-buttons__services-list" id="jetpack-sharing-serivces-list"><!-- wp:jetpack/sharing-button {"service":"x","label":"X"} /-->

<!-- wp:jetpack/sharing-button {"service":"facebook","label":"Facebook"} /-->

<!-- wp:jetpack/sharing-button {"service":"linkedin","label":"LinkedIn"} /-->

<!-- wp:jetpack/sharing-button {"service":"mail","label":"Mail"} /--></ul>
<!-- /wp:jetpack/sharing-buttons --></div>
<!-- /wp:group -->

<!-- wp:group {"className":"article-credits","layout":{"type":"flex","orientation":"horizontal"}} -->
<div class="wp-block-group article-credits"><!-- wp:laao/article-credits /--></div>
<!-- /wp:group -->

<!-- wp:group {"className":"article-text","layout":{"type":"constrained"}} -->
<div class="wp-block-group article-text"><!-- wp:adsanity/rotating-ad {"group_id":62,"group_name":"160x600","ad_id":48707,"time":"8","rendered_ad":{"classes":"ad-160x600 adsanity-160x600  adsanity- alignnone adsanity-alignnone","markup":"\u003cdiv id=\u0022ad-48707\u0022 class=\u0022ad-160x600 adsanity-160x600  adsanity-\u0022\n\u003e\n\n\u003ca rel=\u0022nofollow\u0022   target=\u0022_blank\u0022\u003e\u003cimg width=\u0022160\u0022 height=\u0022600\u0022 src=\u0022http://laartsonline.local/wp-content/uploads/2024/05/JLY_LAAO____160-x-600.jpg\u0022 class=\u0022no-lazy-load wp-post-image\u0022 alt=\u0022\u0022 decoding=\u0022async\u0022 fetchpriority=\u0022high\u0022 srcset=\u0022http://laartsonline.local/wp-content/uploads/2024/05/JLY_LAAO____160-x-600.jpg 160w, http://laartsonline.local/wp-content/uploads/2024/05/JLY_LAAO____160-x-600-80x300.jpg 80w\u0022 sizes=\u0022(max-width: 160px) 100vw, 160px\u0022 /\u003e\u003c/a\u003e\n\u003c/div\u003e","id":48707,"isNetwork":false}} /-->

<!-- wp:post-content {"layout":{"type":"constrained"}} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group --></article>
<!-- /wp:group -->
<!-- /wp:post-template --></div>
<!-- /wp:query -->
