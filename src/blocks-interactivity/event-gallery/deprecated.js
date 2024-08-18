const v1 = {
  attributes: {
    images: {
      type: 'array',
      default: [],
    },
  },
  save({ attributes }) {
    return (
      <div className='wp-block-event-gallery columns-10'>
        {attributes.images.map((image, index) => {
          return (
            <figure key={image.id} className='wp-block-event-gallery-item'>
              <a href={image.url}>
                <img className={`wp-image-${image.id}`} key={index} loading='lazy' data-link={image.link} data-id={image.id} src={image.sizes.thumbnail.url} />
              </a>
            </figure>
          );
        })}
      </div>
    );
  }
};

export default [v1];
