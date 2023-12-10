const floatRegex = new RegExp(/^[0-9]*\.?[0-9]+s$/)

const transitionExpandTemplate = document.createElement("template")
transitionExpandTemplate.innerHTML = `
<style>
	.transition-expand {
		display: grid;
		transition: 
			grid-template-rows var(--transition-duration), 
			grid-template-columns var(--transition-duration);
		overflow: var(--overflow, none);
	}

	.transition-expand[aria-expanded="true"][direction="vertical"] {
		grid-template-rows: 1fr;
	}

	.transition-expand[aria-expanded="false"][direction="vertical"] {
		grid-template-rows: 0fr;
	}

	.transition-expand[aria-expanded="true"][direction="horizontal"] {
		grid-template-columns: 1fr;
	}

	.transition-expand[aria-expanded="false"][direction="horizontal"] {
		grid-template-columns: 0fr;
	}

	.transition-expand[aria-expanded="true"][direction="horizontal"][animation="slide"] {
		.transition-expand__collapsible {
			margin-left: 0%;
		}
	}

	.transition-expand[aria-expanded="false"][direction="horizontal"][animation="slide"] {
		animation: collapse-columns-at-the-last-moment var(--transition-duration) forwards;

		.transition-expand__collapsible {
			margin-left: 100%;
		}
	}

	.transition-expand__collapsible {
		overflow: var(--overflow, none);
		transition: margin-left var(--transition-duration);
	}

	.transition-expand__fixed-width {
		width: var(--width);
	}

	@keyframes collapse-columns-at-the-last-moment {
		0% {
			grid-template-columns: 1fr;
		}

		99% {
			grid-template-columns: 1fr;
		}
		
		100% {
			grid-template-columns: 0fr;
		}
	}
</style>

<div class="transition-expand" aria-expanded="true" direction="horizontal">
	<div class="transition-expand__collapsible">
		<div class="transition-expand__fixed-width">
			<slot></slot>
		</div>
	<div>
</div>
`

class TransitionExpand extends HTMLElement {
	static observedAttributes = [
		"aria-expanded",
		"direction",
		"duration",
		"animation",
	]

	constructor() {
		super()

		this._shadowRoot = this.attachShadow({ mode: "open" })
		this._shadowRoot.appendChild(
			transitionExpandTemplate.content.cloneNode(true)
		)

		this.transitionExpand = this._shadowRoot.querySelector(".transition-expand")
		this.fixedWidthStyles = getComputedStyle(
			this._shadowRoot.querySelector(".transition-expand__fixed-width")
		)
		this.transitionExpand.style.setProperty("--transition-duration", ".5s")
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return

		if (name === "aria-expanded") {
			this.#ariaExpandedHandle(newValue)
			return
		}

		if (name === "direction") {
			this.#directionHandle(newValue)
			return
		}

		if (name === "duration") {
			this.#durationHandle(newValue)
			return
		}

		if (name === "animation") {
			this.#animationHandle(newValue)
			return
		}
	}

	#ariaExpandedHandle(newValue) {
		if (newValue === "false") {
			this.transitionExpand.style.setProperty("--overflow", "hidden")
			this.transitionExpand.style.setProperty(
				"--width",
				this.fixedWidthStyles.width
			)
		}

		this.transitionExpand.setAttribute("aria-expanded", newValue)
	}

	#directionHandle(newValue) {
		if (!["horizontal", "vertical"].includes(newValue)) return

		this.transitionExpand.setAttribute("direction", newValue)
	}

	#durationHandle(newValue) {
		if (!floatRegex.test(newValue)) return

		this.transitionExpand.style.setProperty("--transition-duration", newValue)
	}

	#animationHandle(newValue) {
		if (newValue !== "slide") return

		this.transitionExpand.setAttribute("animation", newValue)
	}

	connectedCallback() {
		this.#subscribeToEvents()
	}

	#subscribeToEvents() {
		this.transitionExpand.addEventListener(
			"transitionend",
			this.#onTransitionEnd
		)
	}

	#unsubscribeFromEvents() {
		this.transitionExpand.removeEventListener(
			"transitionend",
			this.#onTransitionEnd
		)
	}

	#onTransitionEnd() {
		if (this.getAttribute("aria-expanded") === "false") {
			return
		}

		this.style.setProperty("--overflow", "none")
		this.style.setProperty("--width", "auto")
	}

	disconnectedCallback() {
		this.#unsubscribeFromEvents()
	}
}

customElements.define("transition-expand", TransitionExpand)
