// Footer link color randomizer
const colors = ["#FF1C1C", "#7100DB", "#13B9E9", "#FFCC00"]
$(".link-block").mouseover(function() {
    $(this).find(".linktext.linkbottom").css("color", colors[Math.floor(Math.random() * colors.length)])
})

const initLenis = () => {
    const lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        orientation: 'vertical', // vertical, horizontal
        gestureOrientation: 'vertical', // vertical, horizontal, both
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    })
    function raf(time) {
        lenis.raf(time)
        requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
}

const init = () => {
    gsap.registerPlugin(ScrollTrigger)
    initLenis()
}

document.addEventListener('DOMContentLoaded', init)