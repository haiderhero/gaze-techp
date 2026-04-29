import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// 0. CUSTOM CURSOR & DEVICE CHECK
// ==========================================

// Check for touch devices to disable custom cursor and optimize
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

if (!isTouchDevice) {
  window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Animate the outline slightly slower for a smooth trailing effect
    cursorOutline.animate({
      left: `${posX}px`,
      top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
  });
} else {
  cursorDot.style.display = 'none';
  cursorOutline.style.display = 'none';
  document.body.style.cursor = 'auto';
}

// Hover effect on links and buttons
const interactables = document.querySelectorAll('a, button, .faq-question');
interactables.forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorOutline.style.width = '60px';
    cursorOutline.style.height = '60px';
    cursorOutline.style.backgroundColor = 'rgba(138, 43, 226, 0.1)';
  });
  el.addEventListener('mouseleave', () => {
    cursorOutline.style.width = '40px';
    cursorOutline.style.height = '40px';
    cursorOutline.style.backgroundColor = 'transparent';
  });
});


// ==========================================
// 1. THREE.JS SETUP (The 3D Background)
// ==========================================

const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- 3D Objects ---
const objectGroup = new THREE.Group();
scene.add(objectGroup);

const geometry = new THREE.IcosahedronGeometry(2, 1);

// Wireframe material - Bright Purple
const materialWireframe = new THREE.MeshBasicMaterial({
  color: 0xab66ff, // Lighter purple
  wireframe: true,
  transparent: true,
  opacity: 0.6
});
const meshWireframe = new THREE.Mesh(geometry, materialWireframe);
// Scale up slightly so it pulses around the core
meshWireframe.scale.set(1.1, 1.1, 1.1);
objectGroup.add(meshWireframe);

// Inner solid material - Brighter, more metallic to catch light
const materialSolid = new THREE.MeshStandardMaterial({
  color: 0x111115, // Dark gray, not pure black
  roughness: 0.2, // Shinier
  metalness: 0.9,
  emissive: 0x220044, // Slight purple glow from within
  emissiveIntensity: 0.5
});
const meshSolid = new THREE.Mesh(geometry, materialSolid);
objectGroup.add(meshSolid);

// Particles for the background - Denser and purpler
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 2000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 20;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.03,
  color: 0x8a2be2, // Brand purple
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending // Makes them glow when overlapping
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- Lighting ---
// Increase ambient light slightly
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Strong Purple Light
const pointLightPurple = new THREE.PointLight(0xab66ff, 50, 10);
pointLightPurple.position.set(3, 3, 4);
scene.add(pointLightPurple);

// Cyan accent light
const pointLightCyan = new THREE.PointLight(0x00f0ff, 30, 10);
pointLightCyan.position.set(-3, -3, 2);
scene.add(pointLightCyan);

// Backlight
const backLight = new THREE.PointLight(0x8a2be2, 50, 10);
backLight.position.set(0, 0, -4);
scene.add(backLight);

// Global mouse position for 3D interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

if (!isTouchDevice) {
  window.addEventListener('mousemove', (event) => {
    // Normalize mouse coordinates from -1 to +1
    mouseX = (event.clientX / sizes.width) * 2 - 1;
    mouseY = -(event.clientY / sizes.height) * 2 + 1;
  });
}

// --- Animation Loop ---
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Smooth mouse follow (Ease)
  targetX = mouseX * 0.5;
  targetY = mouseY * 0.5;

  // Idle rotation + Mouse tilt
  objectGroup.rotation.y = elapsedTime * 0.15 + targetX;
  objectGroup.rotation.x = elapsedTime * 0.1 - targetY;
  
  // Pulsing effect on the wireframe
  const scale = 1.05 + Math.sin(elapsedTime * 2) * 0.05;
  meshWireframe.scale.set(scale, scale, scale);

  particlesMesh.rotation.y = -elapsedTime * 0.03 + (targetX * 0.2);
  particlesMesh.rotation.x = (targetY * 0.2);
  particlesMesh.position.y = Math.sin(elapsedTime * 0.5) * 0.2; // Gentle float

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};
tick();

// --- Resize Handler ---
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ==========================================
// 2. GSAP SCROLL ANIMATIONS
// ==========================================

// --- 3D Object Scroll Link ---
let tl3D = gsap.timeline({
  scrollTrigger: {
    trigger: '.scroll-content',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
  }
});

tl3D.to(objectGroup.rotation, { y: Math.PI * 4, x: Math.PI * 2, ease: "none" }, 0);
tl3D.to(camera.position, { z: 2, ease: "power1.inOut" }, 0); // Zoom in
tl3D.to(materialSolid, { emissiveIntensity: 2, ease: "none" }, 0); // Glow brighter


// --- Hero Section ---
// Note: Hero animation is now triggered inside the Preloader sequence at the bottom of the file
// to ensure it only plays AFTER the site is fully loaded.

// --- Services Section (Staggered fade in) ---
gsap.from('.service-card', {
  scrollTrigger: {
    trigger: '#services',
    start: 'top 70%',
  },
  y: 50,
  opacity: 0,
  duration: 0.8,
  stagger: 0.2, // Animate one by one
  ease: "power3.out"
});

// --- Portfolio Horizontal Scroll ---
// Only apply horizontal scroll on desktop
if (window.innerWidth > 991) {
  const portfolioWrapper = document.querySelector('.portfolio-container');
  const panels = gsap.utils.toArray('.project-panel');

  gsap.to(panels, {
    xPercent: 100 * (panels.length - 1), // Move right in RTL
    ease: "none",
    scrollTrigger: {
      trigger: ".portfolio-section",
      pin: true, // Pin the section in place while scrolling horizontally
      start: "top top",
      scrub: 1,
      snap: 1 / (panels.length - 1), // Snap to each project
      end: () => "+=" + portfolioWrapper.offsetWidth
    }
  });
}

// --- Number Counter Animation ---
const stats = document.querySelectorAll('.stat-number');
stats.forEach(stat => {
  gsap.to(stat, {
    scrollTrigger: {
      trigger: '.stats-section',
      start: 'top 80%',
    },
    innerHTML: stat.getAttribute('data-target'),
    duration: 2,
    snap: { innerHTML: 1 }, // Round to integers
    ease: "power2.out"
  });
});

// ==========================================
// 3. UI INTERACTIONS
// ==========================================

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    // Close others
    faqItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove('active');
      }
    });
    // Toggle current
    item.classList.toggle('active');
  });
});

// Navbar active state on scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.navbar a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').includes(current)) {
      link.classList.add('active');
    }
  });
});

// Spotlight hover effect on Service Cards
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// Magnetic Buttons Logic
if (!isTouchDevice) {
  const magneticElements = document.querySelectorAll('.btn, .fab-whatsapp');
  
  magneticElements.forEach(elem => {
    elem.addEventListener('mousemove', (e) => {
      const rect = elem.getBoundingClientRect();
      const h = rect.width / 2;
      const w = rect.height / 2;
      
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - w;

      // Pull the button towards mouse
      gsap.to(elem, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    elem.addEventListener('mouseleave', () => {
      // Return to original position
      gsap.to(elem, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
    });
  });
}

// ==========================================
// 4. PRELOADER & OPTIMIZATIONS
// ==========================================

if (isTouchDevice) {
  // Lower pixel ratio on mobile for better performance
  renderer.setPixelRatio(1);
}

// Preloader Animation Function
function playPreloader() {
  const tlLoader = gsap.timeline();
  
  // Simulate loading bar
  tlLoader.to('.loading-bar', {
    width: '100%',
    duration: 1.5,
    ease: 'power2.inOut'
  })
  .to('#preloader', {
    yPercent: -100, // Slide up
    duration: 0.8,
    ease: 'power4.inOut',
    delay: 0.2,
    onComplete: () => {
      document.getElementById('preloader').style.display = 'none';
      document.body.style.overflow = 'auto'; // ensure scroll is enabled
    }
  })
  // Trigger hero animation after load
  .from('.hero-content', {
    y: 100,
    opacity: 0,
    duration: 1.5,
    ease: "power4.out"
  }, "-=0.2"); // Start slightly before preloader finishes sliding up
}

// Trigger preloader robustly
if (document.readyState === 'complete') {
  playPreloader();
} else {
  window.addEventListener('load', playPreloader);
  // Fallback in case load event fails or takes too long
  setTimeout(playPreloader, 3000); 
}
