function showPhotos() {
    document.body.removeAttribute('hide-any-photos');
    // console.log('showPhotos');
}
function hidePhotos() {
    document.body.setAttribute('hide-any-photos', 'true');
}
function showVideos() {
    document.body.removeAttribute('hide-any-videos');
}
function hideVideos() {
    document.body.setAttribute('hide-any-videos', 'true');
}
function commonSettingUpdate(settings={ photos: false, videos: false }) {
  if (settings.photos) {
    hidePhotos?.();
  }else{
    showPhotos?.();
  }
  
  if (settings.videos) {
    hideVideos?.();
  }else{
    showVideos?.();
  }
}
