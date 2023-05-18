import React, {useCallback, useMemo} from 'react'
import {
  RefreshControl,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useAnalytics} from 'lib/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb, isWeb} from 'platform/detection'
import {s, colors} from 'lib/styles'
import DraggableFlatList, {
  ShadowDecorator,
  ScaleDecorator,
} from 'react-native-draggable-flatlist'
import {CustomFeed} from 'view/com/feeds/CustomFeed'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import * as Toast from 'view/com/util/Toast'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>

export const SavedFeeds = withAuthRequired(
  observer(({}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const {screen} = useAnalytics()

    const savedFeeds = useMemo(() => store.me.savedFeeds, [store])
    useFocusEffect(
      useCallback(() => {
        screen('SavedFeeds')
        store.shell.setMinimalShellMode(false)
        savedFeeds.refresh()
      }, [screen, store, savedFeeds]),
    )

    const renderListEmptyComponent = useCallback(() => {
      return (
        <View
          style={[
            pal.border,
            !isDesktopWeb && s.flex1,
            pal.viewLight,
            styles.empty,
          ]}>
          <Text type="lg" style={[pal.text]}>
            You don't have any saved feeds.
          </Text>
        </View>
      )
    }, [pal])

    const renderListFooterComponent = useCallback(() => {
      return (
        <View style={styles.footer}>
          {savedFeeds.isLoading && <ActivityIndicator />}
        </View>
      )
    }, [savedFeeds])

    const onRefresh = useCallback(() => savedFeeds.refresh(), [savedFeeds])

    const onDragEnd = useCallback(
      async ({data}) => {
        try {
          await savedFeeds.reorderPinnedFeeds(data)
        } catch (e) {
          Toast.show('There was an issue contacting the server')
          store.log.error('Failed to save pinned feed order', {e})
        }
      },
      [savedFeeds, store],
    )

    return (
      <CenteredView
        style={[
          s.hContentRegion,
          pal.border,
          isDesktopWeb && styles.desktopContainer,
        ]}>
        <ViewHeader
          title="Edit My Feeds"
          showOnDesktop
          showBorder={!isDesktopWeb}
        />
        <DraggableFlatList
          containerStyle={[!isDesktopWeb && s.flex1]}
          data={[...savedFeeds.pinned, ...savedFeeds.unpinned]} // make a copy so this FlatList re-renders when pinned changes
          keyExtractor={item => item.data.uri}
          refreshing={savedFeeds.isRefreshing}
          refreshControl={
            <RefreshControl
              refreshing={savedFeeds.isRefreshing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          renderItem={({item, drag}) => <ListItem item={item} drag={drag} />}
          initialNumToRender={10}
          ListFooterComponent={renderListFooterComponent}
          ListEmptyComponent={renderListEmptyComponent}
          extraData={savedFeeds.isLoading}
          onDragEnd={onDragEnd}
        />
      </CenteredView>
    )
  }),
)

const ListItem = observer(
  ({item, drag}: {item: CustomFeedModel; drag: () => void}) => {
    const pal = usePalette('default')
    const store = useStores()
    const savedFeeds = useMemo(() => store.me.savedFeeds, [store])
    const isPinned = savedFeeds.isPinned(item)

    const onTogglePinned = useCallback(
      () =>
        savedFeeds.togglePinnedFeed(item).catch(e => {
          Toast.show('There was an issue contacting the server')
          store.log.error('Failed to toggle pinned feed', {e})
        }),
      [savedFeeds, item, store],
    )
    const onPressUp = useCallback(
      () =>
        savedFeeds.movePinnedFeed(item, 'up').catch(e => {
          Toast.show('There was an issue contacting the server')
          store.log.error('Failed to set pinned feed order', {e})
        }),
      [store, savedFeeds, item],
    )
    const onPressDown = useCallback(
      () =>
        savedFeeds.movePinnedFeed(item, 'down').catch(e => {
          Toast.show('There was an issue contacting the server')
          store.log.error('Failed to set pinned feed order', {e})
        }),
      [store, savedFeeds, item],
    )

    return (
      <ScaleDecorator>
        <ShadowDecorator>
          <Pressable
            accessibilityRole="button"
            onLongPress={isPinned ? drag : undefined}
            style={[styles.itemContainer, pal.border]}>
            {isPinned && isWeb ? (
              <View style={styles.webArrowButtonsContainer}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onPressUp}>
                  <FontAwesomeIcon
                    icon="arrow-up"
                    size={12}
                    style={[pal.text, styles.webArrowUpButton]}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onPressDown}>
                  <FontAwesomeIcon
                    icon="arrow-down"
                    size={12}
                    style={[pal.text]}
                  />
                </TouchableOpacity>
              </View>
            ) : isPinned ? (
              <FontAwesomeIcon
                icon="bars"
                size={20}
                color={pal.colors.text}
                style={s.ml20}
              />
            ) : null}
            <CustomFeed
              key={item.data.uri}
              item={item}
              showSaveBtn
              style={styles.noBorder}
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onTogglePinned}>
              <FontAwesomeIcon
                icon="thumb-tack"
                size={20}
                color={isPinned ? colors.blue3 : pal.colors.icon}
              />
            </TouchableOpacity>
          </Pressable>
        </ShadowDecorator>
      </ScaleDecorator>
    )
  },
)

const styles = StyleSheet.create({
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    minHeight: '100vh',
  },
  footer: {
    paddingVertical: 20,
  },
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 10,
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingRight: 16,
  },
  webArrowButtonsContainer: {
    paddingLeft: 16,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  webArrowUpButton: {
    marginBottom: 10,
  },
  noBorder: {
    borderTopWidth: 0,
  },
})
