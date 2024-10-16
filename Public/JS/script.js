document.querySelectorAll('.like-button').forEach(button => {
  button.addEventListener('click', () => {
    const postId = button.getAttribute('data-post-id');
    fetch(`/like/${postId}`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          button.innerHTML = `Like (${data.likeCount})`;
        }
      });
  });
});

document.querySelectorAll('.dislike-button').forEach(button => {
  button.addEventListener('click', () => {
    const postId = button.getAttribute('data-post-id');
    fetch(`/dislike/${postId}`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          button.innerHTML = `Dislike (${data.dislikeCount})`;
        }
      });
  });
});
