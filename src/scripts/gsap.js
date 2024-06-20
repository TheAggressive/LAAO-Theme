import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Navigation /////////////////////////////////////////////////

const responsive = gsap.matchMedia();

responsive.add('(min-width: 1024px)', () => {
	const nav = gsap.timeline({
		scrollTrigger: {
			trigger: '.site-nav',
			start: 'top-=0 top',
			endTrigger: '.site-footer',
			end: 'top bottom',
			toggleActions: 'play reverse play reverse',
			scrub: false,
			pin: true,
			markers: false,
		},
	});
});

// Site Slogan ///////////////////////////////////////////////////////
let words = document.querySelectorAll('.site-slogan h3');
words.forEach((word) => {
	let letters = word.textContent.split('');
	word.textContent = '';
	letters.forEach((letter) => {
		let span = document.createElement('span');
		span.textContent = letter;
		span.className = 'letter';
		word.append(span);
	});
});

let tl = gsap.timeline({
	repeat: -1,
	defaults: { stagger: 0.05 },
	paused: true,
});

words.forEach((word, i) => {
	if (i) {
		tl.from(
			word.childNodes,
			{
				y: -100,
				ease: 'expo.out',
			},
			'+=5',
		);
		tl.to(
			words[i - 1].childNodes,
			{
				y: 100,
				ease: 'expo.in',
			},
			'<-=0.85',
		);
	}
});
tl.fromTo(
	words[0].childNodes,
	{
		y: -100,
	},
	{
		y: 0,
		ease: 'expo.out',
		immediateRender: false,
	},
	'+=5',
).to(
	words[words.length - 1].childNodes,
	{
		y: 100,
		ease: 'expo.in',
	},
	'<-=0.85',
);

gsap.from(words[0].childNodes, {
	y: -100,
	ease: 'expo.out',
	stagger: 0.05,
	onComplete: () => tl.play(),
});
