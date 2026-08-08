import { Platform, StyleSheet } from 'react-native';

/** Shared shadow helper — web box-shadow / native shadow. */
export const platformShadow = (webValue: string, nativeValue: object) =>
  Platform.OS === 'web'
    ? { boxShadow: webValue }
    : nativeValue;

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf7f2',
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingLabel: {
    marginTop: 12,
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
  },

  collectionLoadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingBottom: 0,
    paddingTop: 0,
  },

  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 6,
    backgroundColor: '#fff',
  },

  logo: {
    width: 95,
    height: 40,
    marginRight: 12,
  },

  searchBox: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
    ...platformShadow('0 2px 6px rgba(0,0,0,0.08)', {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    }),
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    marginRight: 8,
  },

  searchIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchBarIconTap: {
    paddingVertical: 8,
    paddingLeft: 4,
    paddingRight: 2,
  },

  cameraIcon: {
    marginRight: 8,
  },

  categoryStripWrap: {
    paddingBottom: 14,
    paddingTop: 4,
  },

  categoryStripContent: {
    paddingHorizontal: 14,
    paddingRight: 30,
  },

  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 10,
  },

  categoryChipActive: {
    backgroundColor: '#ff6a00',
    borderColor: '#ff6a00',
  },

  categoryChipActiveShadow: {
    ...platformShadow('0 2px 6px rgba(255,106,0,0.3)', {
        shadowColor: '#ff6a00',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    }),
  },

  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },

  categoryChipTextActive: {
    color: '#fff',
  },

  homeTopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 0,
    paddingBottom: 10,
  },

  homeTopInfoFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },

  homeCollectionScroll: {
    flex: 1,
    marginLeft: 10,
  },

  homeCollectionScrollContent: {
    alignItems: 'center',
    paddingRight: 14,
    gap: 10,
  },

  homePill: {
    backgroundColor: '#fff3e8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  homePillText: {
    color: '#ff6a00',
    fontWeight: '800',
    fontSize: 13,
  },

  safeBar: {
    marginHorizontal: 14,
    marginBottom: 16,
    backgroundColor: '#6a2cff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...platformShadow('0 0 16px rgba(143,98,255,0.45)', {
        shadowColor: '#8f62ff',
        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: {
          width: 0,
          height: 0,
        },
        elevation: 10,
    }),
    borderWidth: 1,
    borderColor: '#b59aff',
  },

  safeBarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },


  heroSlideshowWrap: {
    marginHorizontal: 14,
    marginBottom: 18,
    height: 390,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff3e8',
    ...platformShadow('0 6px 18px rgba(0,0,0,0.12)', {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: {
          width: 0,
          height: 6,
        },
        elevation: 5,
    }),
  },

  heroPager: {
    flex: 1,
    height: 390,
  },

  heroSlide: {
    height: 390,
    backgroundColor: '#ff6a00',
    overflow: 'hidden',
  },

  heroSlideMedia: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#ff6a00',
  },

  heroSlideFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ff6a00',
  },

  heroImagePoster: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#ff6a00',
  },

  heroFirstSlideGuard: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  heroVideoPoster: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#ff6a00',
  },

  heroVideoPosterFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ff6a00',
  },
  heroVideoPosterNoPointer: {
    pointerEvents: 'none',
  },

  heroSlideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },

  heroSlideTitle: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '900',
  },

  heroSlideSubtitle: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 5,
    maxWidth: '82%',
  },

  haulSlide: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#d85205',
  },

  haulGlowTop: {
    position: 'absolute',
    top: -42,
    right: -34,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(255,149,38,0.42)',
  },

  haulGlowBottom: {
    position: 'absolute',
    bottom: -72,
    left: -34,
    width: 224,
    height: 154,
    borderRadius: 112,
    backgroundColor: 'rgba(115,31,0,0.22)',
  },

  haulDotCluster: {
    position: 'absolute',
    top: 30,
    left: 22,
    width: 58,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    opacity: 0.72,
  },

  haulTinyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,232,199,0.9)',
  },

  haulTextColumn: {
    position: 'absolute',
    left: 26,
    top: 68,
    bottom: 42,
    width: '58%',
    justifyContent: 'center',
    zIndex: 2,
  },

  haulTitle: {
    color: '#fff',
    fontSize: 39,
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(85,24,0,0.24)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  haulAccentLine: {
    width: 82,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#ff8a2b',
    marginTop: 18,
    marginBottom: 18,
  },

  haulSubtitle: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    maxWidth: '82%',
    textShadowColor: 'rgba(85,24,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  haulVisualColumn: {
    position: 'absolute',
    right: 8,
    top: 24,
    bottom: 22,
    width: '48%',
    zIndex: 1,
  },

  haulSavingsBadge: {
    position: 'absolute',
    top: 28,
    right: 38,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#fff1d5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.34)',
    transform: [{ rotate: '-10deg' }],
    ...platformShadow('0 9px 18px rgba(78,22,0,0.18)', {
      shadowColor: '#4e1600',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 9 },
      elevation: 3,
    }),
  },

  haulSavingsBadgeText: {
    position: 'absolute',
    color: '#ff6a00',
    fontSize: 20,
    fontWeight: '900',
  },

  haulSparkle: {
    position: 'absolute',
    width: 15,
    height: 15,
    backgroundColor: '#fff6e8',
    transform: [{ rotate: '45deg' }],
    opacity: 0.9,
  },

  haulSparkleOne: {
    top: 76,
    left: 20,
  },

  haulSparkleTwo: {
    top: 135,
    right: 11,
    width: 12,
    height: 12,
    opacity: 0.72,
  },

  haulBoxStack: {
    position: 'absolute',
    right: 10,
    bottom: 32,
    width: 150,
    height: 185,
  },

  haulBox: {
    position: 'absolute',
    backgroundColor: '#cb842f',
    borderWidth: 1,
    borderColor: 'rgba(107,50,7,0.15)',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    ...platformShadow('0 8px 14px rgba(83,28,0,0.18)', {
      shadowColor: '#531c00',
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    }),
  },

  haulBoxSmall: {
    top: 0,
    right: 25,
    width: 92,
    height: 54,
    backgroundColor: '#d69038',
  },

  haulBoxMedium: {
    top: 58,
    right: 10,
    width: 124,
    height: 67,
    backgroundColor: '#c88230',
  },

  haulBoxLarge: {
    bottom: 0,
    right: 0,
    width: 148,
    height: 76,
    backgroundColor: '#bc7628',
  },

  haulBoxTape: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: '100%',
    backgroundColor: 'rgba(255,211,139,0.58)',
  },

  haulBoxLogo: {
    color: 'rgba(255,106,0,0.72)',
    fontSize: 18,
    fontWeight: '900',
  },

  haulBagLarge: {
    position: 'absolute',
    left: 8,
    bottom: 24,
    width: 78,
    height: 93,
    borderRadius: 6,
    backgroundColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-2deg' }],
    ...platformShadow('0 10px 16px rgba(76,23,0,0.18)', {
      shadowColor: '#4c1700',
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 2,
    }),
  },

  haulBagHandle: {
    position: 'absolute',
    top: -15,
    width: 38,
    height: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#f5d2a2',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  haulBagLogo: {
    color: '#fff4e9',
    fontSize: 19,
    fontWeight: '900',
  },

  haulBagSmall: {
    position: 'absolute',
    left: 79,
    bottom: 10,
    width: 51,
    height: 63,
    borderRadius: 5,
    backgroundColor: '#ffe3bb',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '3deg' }],
  },

  haulBagHandleSmall: {
    position: 'absolute',
    top: -11,
    width: 25,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#c58a48',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },

  haulBagSmallLogo: {
    color: '#db6509',
    fontSize: 13,
    fontWeight: '900',
  },

  heroUpdatesTouchable: {
    flex: 1,
  },

  heroShopNowButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff6a00',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 999,
  },

  heroShopNowButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },


  heroDotsRow: {
    position: 'absolute',
    bottom: 9,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },

  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  heroDotActive: {
    width: 18,
    backgroundColor: '#fff',
  },


  heroUpdatesSlide: {
    flex: 1,
    backgroundColor: '#fffaf4',
  },

  heroUpdatesHeader: {
    height: 76,
    backgroundColor: '#080808',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  heroUpdatesBell: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  heroUpdatesHeaderTextWrap: {
    flex: 1,
  },

  heroUpdatesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },

  heroUpdatesSubtitle: {
    color: '#d8d8d8',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 2,
  },

  heroUpdatesCountBadge: {
    backgroundColor: '#f0e7ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },

  heroUpdatesCountText: {
    color: '#6a2cff',
    fontSize: 11,
    fontWeight: '900',
  },

  heroUpdatesList: {
    flex: 1,
  },

  heroUpdatesListContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 42,
  },

  heroUpdateCard: {
    minHeight: 112,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffb066',
    backgroundColor: '#fffaf4',
    marginBottom: 10,
    padding: 10,
    flexDirection: 'row',
    position: 'relative',
  },

  heroUpdateIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  heroUpdateContent: {
    flex: 1,
    paddingRight: 12,
  },

  heroUpdateLabel: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 5,
  },

  heroUpdateLabelText: {
    fontSize: 10,
    fontWeight: '900',
  },

  heroUpdateTitle: {
    color: '#111',
    fontSize: 14,
    fontWeight: '900',
  },

  heroUpdateBody: {
    color: '#56504a',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 3,
  },

  heroUpdateTime: {
    color: '#8d8278',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  heroUpdateAction: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },

  heroUpdateDot: {
    position: 'absolute',
    top: 14,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  showcaseWrap: {
    paddingTop: 6,
    paddingBottom: 12,
  },

  showcaseHeaderRow: {
    marginLeft: 14,
    marginRight: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  showcaseTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },

  viewAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff6a00',
  },

  showcaseRow: {
    paddingHorizontal: 14,
    paddingRight: 26,
    paddingBottom: 6,
  },

  collectionProductCard: {
    width: 170,
    marginRight: 12,
    position: 'relative',
  },

  collectionProductImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#eee',
  },

  collectionHotBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff6a00',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  collectionHotBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  collectionProductTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    marginTop: 6,
  },

  collectionProductPrice: {
    fontSize: 14,
    color: '#ff4d00',
    fontWeight: '800',
    marginTop: 4,
  },

  laceFrontSection: {
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 10,
  },

  laceFrontHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingRight: 4,
  },

  laceFrontLoadingWrap: {
    minHeight: 168,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },

  laceFrontTitle: {
    fontSize: 34,
    fontWeight: '500',
    color: '#111',
    marginBottom: 0,
  },

  laceFrontVideoPosterEmpty: {
    backgroundColor: '#eee',
  },

  laceFrontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },

  laceFrontVideoCard: {
    width: '48%',
    aspectRatio: 0.72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },

  laceFrontVideo: {
    width: '100%',
    height: '100%',
  },

  laceFrontVideoFallback: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  laceFrontButton: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#ff5a00',
    borderRadius: 25,
  },

  laceFrontButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  videoCard: {
    width: '47.5%',
    aspectRatio: 0.74,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ededed',
    position: 'relative',
  },

  videoCardMedia: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backgroundColor: '#ededed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoCardPlaceholder: {
    zIndex: 2,
  },

  videoPlaceholderBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -21,
    marginLeft: -21,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.16)',
  },

  feedHeaderWrap: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },

  feedHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },

  visualSearchStatusWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  visualSearchStatusText: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },

  cameraScreen: {
    flex: 1,
    backgroundColor: '#000',
  },

  cameraPreview: {
    flex: 1,
  },

  cameraControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
  },

  cameraCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  cameraCaptureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },

  cameraCaptureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#111',
  },
  galleryPreviewScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  galleryPreviewImage: {
    flex: 1,
    width: '100%',
  },
  galleryPreviewControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingBottom: 28,
    paddingTop: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  galleryPreviewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  galleryPreviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  gallerySecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  gallerySecondaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  galleryPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6a00',
  },
  galleryPrimaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  feedFooterLoading: {
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeBottomSpacer: {
    height: 78,
  },

  columnWrap: {
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  card: {
    width: '48%',
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
  },

  productImageWrap: {
    position: 'relative',
  },

  productImage: {
    width: '100%',
    height: 230,
    borderRadius: 10,
    backgroundColor: '#eee',
  },

  productHotBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff6a00',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  productHotBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  productTitle: {
    fontSize: 14,
    color: '#111',
    marginTop: 8,
    lineHeight: 18,
    fontWeight: '600',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },

  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ff4d00',
    marginRight: 8,
  },

  oldPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  soldText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  soldTextUnavailable: {
    color: '#b42318',
  },

  cartButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  emptyWrap: {
    paddingVertical: 36,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: '#666',
  },

  loadingText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#666',
    paddingVertical: 16,
  },

  quickAddButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 106, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 5,
  },

  // Floating cart button
  floatingCartWrap: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    zIndex: 50,
  },
  floatingCartButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff6a00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff6a00',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  floatingCartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
});
