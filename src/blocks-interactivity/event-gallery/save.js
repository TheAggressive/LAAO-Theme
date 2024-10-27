export default function Save(props) {
	return (
		<div className="wp-block-event-gallery">
			{props.attributes.images.map((image, index) => {
				return (
					<figure
						key={image.id}
						className="wp-block-event-gallery-item"
					>
						<a href={image.url}>
							<img
								className={`wp-image-${image.id}`}
								key={index}
								loading="lazy"
								data-link={image.link}
								data-id={image.id}
								src={image.sizes.thumbnail.url}
								alt={image.alt}
							/>
						</a>
					</figure>
				);
			})}
		</div>
	);
}
