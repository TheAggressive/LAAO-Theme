<?php
/**
 * Title: Posts Query Loop
 * Slug: laao/query-loop-posts
 * Categories: query
 * Block Types: core/query, core/query-loop
 * Inserter: true
 * Description: A query loop pattern that displays posts in a grid layout with pagination
 */

?>
<!-- wp:query {"queryId":0,"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"displayLayout":{"type":"list"},"align":"wide"} -->
<div class="wp-block-query alignwide">
	<!-- wp:post-template {"align":"wide"} -->
	<!-- wp:group {"tagName":"article","className":"cover-article","layout":{"type":"constrained"}} -->
	<article class="wp-block-group cover-article">
			<!-- wp:group {"className":"article-images","layout":{"type":"flex","orientation":"vertical"}} -->
			<div class="wp-block-group article-images">
				<!-- Featured Image -->
				<!-- wp:post-featured-image {"sizeSlug":"full","className":"featured-image"} /-->

				<!-- Secondary Images -->
				<!-- wp:group {"className":"secondary-images","layout":{"type":"flex","orientation":"horizontal"}} -->
				<div class="wp-block-group secondary-images">
					<!-- wp:image {"sizeSlug":"medium","linkDestination":"none"} -->
					<figure class="wp-block-image size-medium">
						<img src="" alt="" />
					</figure>
					<!-- /wp:image -->

					<!-- wp:image {"sizeSlug":"medium","linkDestination":"none"} -->
					<figure class="wp-block-image size-medium">
						<img src="" alt="" />
					</figure>
					<!-- /wp:image -->
				</div>
				<!-- /wp:group -->

				<!-- wp:post-excerpt {"className":"article-captions"} /-->
			</div>
			<!-- /wp:group -->

			<!-- wp:group {"className":"article-content","layout":{"type":"constrained"}} -->
			<div class="wp-block-group article-content">
				<!-- wp:post-title {"level":2,"className":"article-title"} /-->

				<!-- wp:group {"className":"social-share","layout":{"type":"flex","orientation":"horizontal"}} -->
				<div class="wp-block-group social-share">
					<!-- wp:social-links {"className":"is-style-logos-only"} -->
					<ul class="wp-block-social-links is-style-logos-only">
						<!-- wp:social-link {"url":"#","service":"twitter"} /-->
						<!-- wp:social-link {"url":"#","service":"facebook"} /-->
						<!-- wp:social-link {"url":"#","service":"linkedin"} /-->
						<!-- wp:social-link {"url":"#","service":"mail"} /-->
					</ul>
					<!-- /wp:social-links -->
				</div>
				<!-- /wp:group -->

				<!-- wp:group {"className":"article-credits","layout":{"type":"flex","orientation":"horizontal"}} -->
				<div class="wp-block-group article-credits">
					<!-- wp:post-author {"showAvatar":false,"showBio":false} /-->
				</div>
				<!-- /wp:group -->

				<!-- wp:group {"className":"ad-container","layout":{"type":"constrained"}} -->
				<div class="wp-block-group ad-container">
					<!-- wp:html -->
					<div class="ad ad-160x600" aria-label="Banner Ad">
						<!-- Ad content will be inserted here -->
					</div>
					<!-- /wp:html -->
				</div>
				<!-- /wp:group -->

				<!-- wp:group {"className":"article-text","layout":{"type":"constrained"}} -->
				<div class="wp-block-group article-text">
					<!-- wp:post-content {"layout":{"type":"constrained"}} /-->
				</div>
				<!-- /wp:group -->
			</div>
			<!-- /wp:group -->
	</article>
	<!-- /wp:group -->
	<!-- /wp:post-template -->

	<!-- wp:query-pagination {"paginationArrow":"arrow","align":"wide"} -->
	<!-- wp:query-pagination-previous /-->
	<!-- wp:query-pagination-numbers /-->
	<!-- wp:query-pagination-next /-->
	<!-- /wp:query-pagination -->
</div>
<!-- /wp:query -->
