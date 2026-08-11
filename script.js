document.querySelectorAll('.package-slider').forEach(function (slider) {
  const track = slider.querySelector('.slider-track');
  const images = track.querySelectorAll('img');
  const dots = slider.querySelectorAll('.slider-dot');
  const prevBtn = slider.querySelector('.prev');
  const nextBtn = slider.querySelector('.next');
  let currentIndex = 0;

  function goToSlide(index) {
    currentIndex = (index + images.length) % images.length;
    track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  nextBtn.addEventListener('click', function () {
    goToSlide(currentIndex + 1);
  });

  prevBtn.addEventListener('click', function () {
    goToSlide(currentIndex - 1);
  });
});