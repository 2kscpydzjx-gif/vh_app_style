document.addEventListener('DOMContentLoaded', function () {
  const hero = document.querySelector('#home .hero');
  if (!hero || hero.querySelector('.heroSlides')) return;
  const oldImage = hero.querySelector(':scope > img');
  const wrap = document.createElement('div');
  wrap.className = 'heroSlides';
  for (let i=1;i<=4;i++){
    const img=document.createElement('img');
    img.className='heroSlide'+(i===1?' active':'');
    img.src='assets/model/hero-'+i+'.png';
    img.alt='';
    wrap.appendChild(img);
  }
  if(oldImage) oldImage.replaceWith(wrap); else hero.prepend(wrap);
  const slides=[...wrap.querySelectorAll('.heroSlide')];
  let current=0;
  setInterval(()=>{
    const next=(current+1)%slides.length;
    slides[next].classList.add('active');
    slides[current].classList.remove('active');
    current=next;
  },2800);
});