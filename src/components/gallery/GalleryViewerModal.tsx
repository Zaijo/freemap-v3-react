import React from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';
import ReactStars from 'react-stars';

import * as at from 'fm3/actionTypes';
import injectL10n, { Translator } from 'fm3/l10nInjector';

import FontAwesomeIcon from 'fm3/components/FontAwesomeIcon';
import GalleryEditForm from 'fm3/components/gallery/GalleryEditForm';

import Modal from 'react-bootstrap/lib/Modal';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Button from 'react-bootstrap/lib/Button';
import Label from 'react-bootstrap/lib/Label';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import FormGroup from 'react-bootstrap/lib/FormGroup';

import { toastsAdd } from 'fm3/actions/toastsActions';

import {
  galleryClear,
  galleryRequestImage,
  galleryShowOnTheMap,
  gallerySetComment,
  gallerySubmitComment,
  gallerySubmitStars,
  galleryEditPicture,
  galleryDeletePicture,
  gallerySetEditModel,
  gallerySavePicture,
  gallerySetItemForPositionPicking,
} from 'fm3/actions/galleryActions';

import 'fm3/styles/gallery.scss';
import { RootAction } from 'fm3/actions';
import { RootState } from 'fm3/storeCreator';

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> & {
    t: Translator;
  };

interface IState {
  loading: boolean;
  isFullscreen: boolean;
  imgKey: number;
  activeImageId: number | null;
}

class GalleryViewerModal extends React.Component<Props, IState> {
  state: IState = {
    loading: true,
    isFullscreen: false,
    imgKey: 0,
    activeImageId: null,
  };

  imageElement: HTMLImageElement;

  fullscreenElement: HTMLDivElement;

  static getDerivedStateFromProps(props, state) {
    if (props.activeImageId !== state.activeImageId) {
      return {
        loading: true,
        activeImageId: props.activeImageId,
      };
    }

    return null;
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener(
      'fullscreenchange',
      this.handleFullscreenChange,
    );
  }

  setImageElement = (imageElement: HTMLImageElement) => {
    this.imageElement = imageElement;
    if (imageElement) {
      imageElement.addEventListener('load', this.handleImageLoad);
    }
  };

  setFullscreenElement = (element: HTMLDivElement) => {
    this.fullscreenElement = element;
  };

  handleFullscreenChange = () => {
    this.setState(state => ({
      isFullscreen: document.fullscreenElement === this.fullscreenElement,
      imgKey: state.imgKey + 1,
    }));

    this.forceUpdate();
  };

  handleEditModelChange = editModel => {
    this.props.onEditModelChange(editModel);
  };

  handleKeydown = (evt: KeyboardEvent) => {
    if (
      (evt.target &&
        ['input', 'select', 'textarea'].includes(
          (evt.target as any).tagName.toLowerCase(),
        )) ||
      !this.props.imageIds ||
      this.props.imageIds.length < 2
    ) {
      // nothing
    } else if (evt.keyCode === 37 /* left key */) {
      this.handlePreviousClick();
    } else if (evt.keyCode === 39 /* right key */) {
      this.handleNextClick();
    }
  };

  handlePreviousClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    const { imageIds, activeImageId, onImageSelect } = this.props;
    if (imageIds) {
      const index = imageIds.findIndex(id => id === activeImageId);
      if (index > 0) {
        onImageSelect(imageIds[index - 1]);
      }
    }
  };

  handleNextClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    const { imageIds, activeImageId, onImageSelect } = this.props;
    if (imageIds) {
      const index = imageIds.findIndex(id => id === activeImageId);
      if (index + 1 < imageIds.length) {
        onImageSelect(imageIds[index + 1]);
      }
    }
  };

  handleIndexChange = (e: React.FormEvent<FormControl>) => {
    const { imageIds, onImageSelect } = this.props;
    if (imageIds) {
      onImageSelect(imageIds[(e.target as HTMLSelectElement).value]);
    }
  };

  handleCommentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    this.props.onCommentSubmit();
  };

  handleCommentChange = (e: React.FormEvent<FormControl>) => {
    this.props.onCommentChange((e.target as HTMLInputElement).value);
  };

  handleImageLoad = () => {
    this.setState({ loading: false });
  };

  handleFullscreen = () => {
    if (!document.exitFullscreen) {
      // unsupported
    } else if (document.fullscreenElement === this.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.fullscreenElement.requestFullscreen();
    }
  };

  handleSave = e => {
    e.preventDefault();
    this.props.onSave();
  };

  render() {
    const {
      imageIds,
      activeImageId,
      onClose,
      onShowOnTheMap,
      image,
      comment,
      onStarsChange,
      user,
      onDelete,
      onEdit,
      editModel,
      allTags,
      onPositionPick,
      language,
      t,
    } = this.props;

    if (!imageIds) {
      return null;
    }

    const index = imageIds.findIndex(id => id === activeImageId);
    if (index === -1) {
      return null;
    }

    const {
      title = '...',
      description = undefined,
      createdAt = undefined,
      takenAt = undefined,
      tags = undefined,
      comments = undefined,
      rating = undefined,
      myStars = undefined,
    } = image || {};

    const { isFullscreen, loading, imgKey } = this.state;

    const nextImageId = imageIds && imageIds[index + 1];
    const prevImageId = index > 0 && imageIds && imageIds[index - 1];

    // TODO const loadingMeta = !image || image.id !== activeImageId;

    const dateFormat = new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const getImageUrl = id =>
      `${process.env.API_URL}/gallery/pictures/${id}/image?width=${
        isFullscreen
          ? window.innerWidth
          : window.matchMedia('(min-width: 992px)').matches
          ? 868
          : 568
      }`;

    const sizes = isFullscreen ? undefined : '(min-width: 992px) 868px, 568px';

    return (
      <Modal show onHide={onClose} bsSize="large">
        <Modal.Header closeButton>
          <Modal.Title>
            {t('gallery.viewer.title')}{' '}
            {imageIds && (
              <FormControl
                componentClass="select"
                value={index}
                onChange={this.handleIndexChange}
                style={{ width: 'auto', display: 'inline-block' }}
              >
                {imageIds.map((_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </FormControl>
            )}
            {imageIds ? ` / ${imageIds.length} ` : ''}
            {title && `- ${title}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            ref={this.setFullscreenElement}
            className={isFullscreen ? 'fullscreen' : ''}
          >
            <div className="carousel">
              <div className="item active">
                <img
                  key={imgKey}
                  ref={this.setImageElement}
                  className={`gallery-image ${loading ? 'loading' : ''}`}
                  src={getImageUrl(activeImageId)}
                  sizes={sizes}
                  alt={title}
                />
                {!!nextImageId && !loading && (
                  <img
                    key={`next-${imgKey}`}
                    style={{ display: 'none' }}
                    src={getImageUrl(nextImageId)}
                    sizes={sizes}
                    alt="next"
                  />
                )}
                {!!prevImageId && !loading && (
                  <img
                    key={`prev-${imgKey}`}
                    style={{ display: 'none' }}
                    src={getImageUrl(prevImageId)}
                    sizes={sizes}
                    alt="prev"
                  />
                )}
              </div>
              {imageIds && (
                <a
                  className={`left carousel-control ${
                    index < 1 ? 'disabled' : ''
                  }`}
                  onClick={this.handlePreviousClick}
                >
                  <Glyphicon glyph="chevron-left" />
                </a>
              )}
              {imageIds && (
                <a
                  className={`right carousel-control ${
                    index >= imageIds.length - 1 ? 'disabled' : ''
                  }`}
                  onClick={this.handleNextClick}
                >
                  <Glyphicon glyph="chevron-right" />
                </a>
              )}
            </div>
            <br />
            {image && (
              <div className="footer">
                {isFullscreen && imageIds && (
                  <>{`${index + 1} / ${imageIds.length}`} ｜ </>
                )}
                {isFullscreen && title && <>{title} ｜ </>}
                {t('gallery.viewer.uploaded', {
                  username: () => (
                    <b key={image.user.name}>{image.user.name}</b>
                  ),
                  createdAt: () =>
                    createdAt && (
                      <b key={createdAt.getTime()}>
                        {dateFormat.format(createdAt)}
                      </b>
                    ),
                })}
                {takenAt && (
                  <>
                    {' ｜ '}
                    {t('gallery.viewer.captured', {
                      takenAt: () =>
                        takenAt && (
                          <b key={takenAt.getTime()}>
                            {dateFormat.format(takenAt)}
                          </b>
                        ),
                    })}
                  </>
                )}
                {' ｜ '}
                <ReactStars
                  className="stars"
                  size={22}
                  value={rating}
                  edit={false}
                />
                {description && ` ｜ ${description}`}
                {tags && tags.length > 0 && ' ｜ '}
                {tags &&
                  tags.map(tag => (
                    <React.Fragment key={tag}>
                      {' '}
                      <Label>{tag}</Label>
                    </React.Fragment>
                  ))}
                {!isFullscreen && editModel && (
                  <form onSubmit={this.handleSave}>
                    <hr />
                    <h5>Úprava</h5>

                    <GalleryEditForm
                      t={t}
                      language={language}
                      model={editModel}
                      allTags={allTags}
                      error={null}
                      onPositionPick={onPositionPick}
                      onModelChange={this.handleEditModelChange}
                    />
                    {/* TODO put inside a form and save in onSubmit */}
                    <Button bsStyle="primary" type="submit">
                      <Glyphicon glyph="save" /> {t('general.save')}
                    </Button>
                  </form>
                )}
                {!isFullscreen && (
                  <>
                    <hr />
                    <h5>{t('gallery.viewer.comments')}</h5>
                    {comments &&
                      comments.map(c => (
                        <p key={c.id}>
                          {dateFormat.format(c.createdAt)} <b>{c.user.name}</b>:{' '}
                          {c.comment}
                        </p>
                      ))}
                    {user && (
                      <form onSubmit={this.handleCommentFormSubmit}>
                        <FormGroup>
                          <InputGroup>
                            <FormControl
                              type="text"
                              placeholder={t('gallery.viewer.newComment')}
                              value={comment}
                              onChange={this.handleCommentChange}
                              maxLength={4096}
                            />
                            <InputGroup.Button>
                              <Button
                                type="submit"
                                disabled={comment.length < 1}
                              >
                                {t('gallery.viewer.addComment')}
                              </Button>
                            </InputGroup.Button>
                          </InputGroup>
                        </FormGroup>
                      </form>
                    )}
                    {user && (
                      <div>
                        {t('gallery.viewer.yourRating')}{' '}
                        <ReactStars
                          className="stars"
                          size={22}
                          half={false}
                          value={myStars}
                          onChange={onStarsChange}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          {image && user && (user.isAdmin || user.id === image.user.id) && (
            <>
              <Button onClick={onEdit} active={!!editModel}>
                <Glyphicon glyph="edit" />
                <span className="hidden-xs"> {t('general.modify')}</span>
              </Button>
              <Button onClick={onDelete} bsStyle="danger">
                <Glyphicon glyph="trash" />
                <span className="hidden-xs"> {t('general.delete')}</span>
              </Button>
            </>
          )}
          <Button onClick={onShowOnTheMap}>
            <FontAwesomeIcon icon="dot-circle-o" />
            <span className="hidden-xs">
              {' '}
              {t('gallery.viewer.showOnTheMap')}
            </span>
          </Button>
          {document.exitFullscreen && (
            <Button onClick={this.handleFullscreen}>
              <Glyphicon glyph="fullscreen" />
              <span className="hidden-xs hidden-sm">
                {' '}
                {t('general.fullscreen')}
              </span>
            </Button>
          )}
          <Button
            href={`${process.env.API_URL}/gallery/pictures/${activeImageId}/image`}
            target="_blank"
          >
            <FontAwesomeIcon icon="external-link" />
            <span className="hidden-sm hidden-xs">
              {' '}
              {t('gallery.viewer.openInNewWindow')}
            </span>
          </Button>
          <Button onClick={onClose}>
            <Glyphicon glyph="remove" />
            <span className="hidden-xs"> {t('general.close')}</span>
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  imageIds: state.gallery.imageIds,
  image: state.gallery.image,
  activeImageId: state.gallery.activeImageId,
  zoom: state.map.zoom,
  pickingPosition: state.gallery.pickingPositionForId !== null,
  comment: state.gallery.comment,
  editModel: state.gallery.editModel,
  user: state.auth.user,
  allTags: state.gallery.tags,
  language: state.l10n.language,
});

const mapDispatchToProps = (dispatch: Dispatch<RootAction>) => ({
  onClose() {
    dispatch(galleryClear());
  },
  onShowOnTheMap() {
    dispatch(galleryShowOnTheMap());
  },
  onImageSelect(id: number) {
    dispatch(galleryRequestImage(id));
  },
  onCommentChange(comment: string) {
    dispatch(gallerySetComment(comment));
  },
  onCommentSubmit() {
    dispatch(gallerySubmitComment());
  },
  onStarsChange(stars: number) {
    dispatch(gallerySubmitStars(stars));
  },
  onEdit() {
    dispatch(galleryEditPicture());
  },
  onDelete() {
    dispatch(
      toastsAdd({
        collapseKey: 'gallery.deletePicture',
        messageKey: 'gallery.viewer.deletePrompt',
        style: 'warning',
        cancelType: [at.GALLERY_CLEAR, at.GALLERY_REQUEST_IMAGE],
        actions: [
          {
            nameKey: 'general.yes',
            action: galleryDeletePicture(),
            style: 'danger',
          },
          { nameKey: 'general.no' },
        ],
      }),
    );
  },
  onEditModelChange(editModel) {
    dispatch(gallerySetEditModel(editModel));
  },
  onSave() {
    dispatch(gallerySavePicture());
  },
  onPositionPick() {
    dispatch(gallerySetItemForPositionPicking(-1));
  },
});

export default compose(
  injectL10n(),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(GalleryViewerModal);
