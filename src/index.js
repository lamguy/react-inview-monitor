import React, { Component } from 'react'
import PropTypes from 'prop-types'
import throttle from 'lodash.throttle'

import getElementOffset from './getElementOffset'

class ScrollMonitor extends Component {
  constructor (props) {
    super()
    this.state = {
      className: props.classNameInitial || ''
    }
    this._handleScroll = this._handleScroll.bind(this)
  }
  componentDidMount () {
    const { useScrollMonitor, mountInitDelayTime, intoViewRatioShownThreshold } = this.props
    if (!useScrollMonitor ||
      typeof useScrollMonitor === 'function' && !useScrollMonitor()) {
      return
    }
    // we are about to look into the DOM for positions of elements,
    // which we will then cache and re-use to assert whether we have
    // scrolled past them etc.
    // Hence this only works if the positions we get here are correct forever,
    // as long as this element stays mounted.
    // (although if this "fails" it will only cause the scrollIntoView props
    //  to be used too early, leading "only" to too early fade-in effects etc
    //  - not absolutely critical)
    // Reasonable to try to wait for images to load,
    // but hard to know generically how long this will take;
    // depends on the site, so let the user specify.
    setTimeout(() => {
      const elementOffsetTop = getElementOffset(this._element).top
      // when element is just above the bottom of the screen
      this._scrollIntoViewThreshold = elementOffsetTop - (window.innerHeight * (1 - intoViewRatioShownThreshold))
      // when element is scrolled past, so again completely out of the screen
      this._scrollOutOffViewThreshold = elementOffsetTop + this._element.getBoundingClientRect().height

      this._throttledScroll = throttle(this._handleScroll, 100)
      window.addEventListener('scroll', this._throttledScroll)
      // in case user has scrolled already
      this._handleScroll()
    }, mountInitDelayTime)
  }
  componentWillUnmount () {
    window.removeEventListener('scroll', this._throttledScroll)
  }
  _handleScroll () {
    const yOffset = window.pageYOffset
    const {
      classNameOnScrollIntoView,
      childPropsOnScrollIntoView
    } = this.props

    if (yOffset > this._scrollIntoViewThreshold) {
      if (classNameOnScrollIntoView || childPropsOnScrollIntoView) {
        this.setState({
          className: classNameOnScrollIntoView,
          childProps: childPropsOnScrollIntoView
        })
        window.removeEventListener('scroll', this._throttledScroll)
      }
    }
  }
  render () {
    const { childProps, className, style } = this.state
    let { children } = this.props
    if (childProps && Object.keys(childProps).length) {
      children = React.cloneElement(children, childProps)
    }
    return (
      <div
        className={className}
        style={style}
        ref={e => {
          if (e) {
            this._element = e
          }
        }}
      >{children}</div>
    )
  }
}

ScrollMonitor.propTypes = {
  // Common usage: first set vis-hidden for classNameInitial,
  classNameInitial: PropTypes.string,
  // then use animate classes in onScrollIntoView, to trigger fade in etc animations
  classNameOnScrollIntoView: PropTypes.string,

  // another use for the ScrollMonitor is to start passing a prop into an element
  // only when it has been scrolled into view; f.e. to autoplay a video.
  childPropsOnScrollIntoView: PropTypes.object,

  // whether to run any scroll monintoring at all;
  // because easier to toggle this prop, then toggle not using the component at all.
  useScrollMonitor: PropTypes.func,

  mountInitDelayTime: PropTypes.number,
  intoViewRatioShownThreshold: PropTypes.number
}
ScrollMonitor.defaultProps = {
  useScrollMonitor: () => true,
  mountInitDelayTime: 0,
  // how much of the element should have be into view before it's considered
  // scrolled into view? default is 15%
  intoViewRatioShownThreshold: 0.15
}

export default ScrollMonitor
