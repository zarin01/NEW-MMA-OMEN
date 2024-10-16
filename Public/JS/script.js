document.querySelectorAll('.like-button').forEach(button => {
  button.addEventListener('click', function() {
    const postId = this.getAttribute('data-post-id');
    fetch(`/post/${postId}/like`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.textContent = `Like (${data.likeCount})`;
          const dislikeButton = this.nextElementSibling;
          dislikeButton.textContent = `Dislike (${data.dislikeCount})`;

          // Disable the like button, enable the dislike button
          this.disabled = true;
          dislikeButton.disabled = false;
        }
      });
  });
});

document.querySelectorAll('.dislike-button').forEach(button => {
  button.addEventListener('click', function() {
    const postId = this.getAttribute('data-post-id');
    fetch(`/post/${postId}/dislike`, { method: 'POST' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.textContent = `Dislike (${data.dislikeCount})`;
          const likeButton = this.previousElementSibling;
          likeButton.textContent = `Like (${data.likeCount})`;

          // Disable the dislike button, enable the like button
          this.disabled = true;
          likeButton.disabled = false;
        }
      });
  });
});
