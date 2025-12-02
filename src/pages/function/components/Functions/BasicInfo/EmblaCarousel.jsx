
import React, { useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import NextButton, { PrevButton, usePrevNextButtons } from './EmblaCarouselArrowButtons'
import { Box, IconButton } from '@mui/material'
import { DeleteOutlineRounded } from '@mui/icons-material'

const TWEEN_FACTOR_BASE = 0.2

const EmblaCarousel = props => {
  const { slides, options, handleDelete } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const tweenFactor = useRef(0)
  const tweenNodes = useRef([])
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi)

  const setTweenNodes = useCallback(emblaApi => {
    tweenNodes.current = emblaApi.slideNodes().map(slideNode => {
      return slideNode.querySelector('.embla__parallax__layer')
    })
  }, [])

  const setTweenFactor = useCallback(emblaApi => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length
  }, [])

  const tweenParallax = useCallback((emblaApi, eventName) => {
    const engine = emblaApi.internalEngine()
    const scrollProgress = emblaApi.scrollProgress()
    const slidesInView = emblaApi.slidesInView()
    const isScrollEvent = eventName === 'scroll'

    emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress
      const slidesInSnap = engine.slideRegistry[snapIndex]

      slidesInSnap.forEach(slideIndex => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach(loopItem => {
            const target = loopItem.target()

            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target)

              if (sign === -1) {
                diffToTarget = scrollSnap - (1 + scrollProgress)
              }
              if (sign === 1) {
                diffToTarget = scrollSnap + (1 - scrollProgress)
              }
            }
          })
        }

        const translate = diffToTarget * (-1 * tweenFactor.current) * 100
        const tweenNode = tweenNodes.current[slideIndex]
        tweenNode.style.transform = `translateX(${translate}%)`
      })
    })
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    setTweenNodes(emblaApi)
    setTweenFactor(emblaApi)
    tweenParallax(emblaApi)

    emblaApi
      .on('reInit', setTweenNodes)
      .on('reInit', setTweenFactor)
      .on('reInit', tweenParallax)
      .on('scroll', tweenParallax)
      .on('slideFocus', tweenParallax)
  }, [emblaApi, tweenParallax])

  return (
    <Box className='embla'>
      <Box className='embla__viewport' ref={emblaRef}>
        <Box className='embla__container'>
          {slides?.map((file, index) => (
            <Box className='embla__slide' key={index}>
              <Box className='embla__parallax'>
                <Box className='embla__parallax__layer'>
                  <IconButton
                    onClick={() => handleDelete(file.key, '', file?.id)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 10,
                      bgcolor: 'white',
                      '&:hover': {
                        bgcolor: 'grey.100'
                      }
                    }}
                  >
                    <DeleteOutlineRounded sx={{ color: 'error.main' }} />
                  </IconButton>
                  <img
                    className='embla__slide__img embla__parallax__img'
                    src={file?.url?.includes('https:') ? file?.url : URL.createObjectURL(file)}
                    alt='Your alt text'
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box className='embla__controls'>
        <Box className='embla__buttons'>
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </Box>
      </Box>
    </Box>
  )
}

export default EmblaCarousel
