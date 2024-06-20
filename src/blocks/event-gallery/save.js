export default function Save(props) {
  return (
    <div className='wp-block-event-gallery columns-10'>
      {props.attributes.images.map((image, index) => {
        return (
          <figure key={image.id} className='wp-block-event-gallery-item'>
            <a href={image.url}>
              <img class={`wp-image-${image.id}`} key={index} loading='lazy' data-link={image.link} data-id={image.id} src={image.sizes.thumbnail.url} />
            </a>
          </figure>
        );
      })}
    </div>
  );
}
