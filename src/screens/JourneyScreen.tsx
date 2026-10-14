import React, { useState } from "react";
import { formatCount } from "../utils/formatCount";
import {
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import {
  EMPTY_SPOT_IMAGE,
  getDecorationImage,
  getFeatureImage,
  getRegionImages,
} from "../constants/journeyImages";
import { getPetImage } from "../constants/petImages";
import { AppSettings, DayRecord, Decoration, GameState } from "../types";
import { getActiveCompanion } from "../utils/companions";
import {
  DECORATION_TYPES,
  getActiveDayRecords,
  getCampLookBack,
  getDecorationType,
  getRegionForTile,
  getRoadPosition,
  getTileFeatures,
  isPlaced,
  REGIONS,
  SPOTS_PER_CAMP,
  TILES_PER_CAMP,
  TILES_PER_REGION,
  TileFeature,
} from "../utils/journey";
import { getLocaleFromSettings } from "../utils/settings";
import { isLookBackVisible } from "../utils/plus";
import { getExploreLeft } from "../utils/explore";
import ExploreButton from "../components/ExploreButton";
import { getStartOfDay } from "../utils/taskSchedule";

interface JourneyScreenProps {
  gameState: GameState;
  settings: AppSettings;
  onBuyDecoration: (typeId: string) => void;
  onPlaceDecoration: (decorationId: string, camp: number, spot: number) => void;
  onRemoveDecoration: (decorationId: string) => void;
  isPlus: boolean;
  exploreBusy: boolean;
  onExplore: () => void;
  onOpenPlus: () => void;
  onUiTap: () => void;
}

/** Horizontal offsets that make the road wind left and right. */
const WIND_OFFSETS = [0, 44, 88, 44];
const MAX_DAY_ITEMS = 12;
/** Where the 3 camp spots sit on the camp scene (left, centre-right, right), as % of the scene. */
const SCENE_SPOTS = [
  { left: "8%", bottom: "8%" },
  { left: "50%", bottom: "4%" },
  { left: "76%", bottom: "12%" },
] as const;

type CopyShape = ReturnType<typeof getAppCopy>;

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
}

function getDecorationName(copy: CopyShape, typeId: string): string {
  return copy.decorationNames[typeId] ?? typeId;
}

function getCampRegion(campIndex: number) {
  // A camp belongs to the region of the tile it closes.
  return REGIONS[getRegionForTile((campIndex + 1) * TILES_PER_CAMP - 1).regionIndex];
}

function DecorationIcon({ typeId, size }: { typeId?: string; size: number }) {
  const source = typeId ? getDecorationImage(typeId) : EMPTY_SPOT_IMAGE;
  if (!source) {
    return <Text style={{ fontSize: size * 0.8 }}>{getDecorationType(typeId ?? "")?.icon ?? "◌"}</Text>;
  }
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
}

function FeatureIcon({ feature, size }: { feature: TileFeature; size: number }) {
  return (
    <Image source={getFeatureImage(feature)} style={{ width: size, height: size }} resizeMode="contain" />
  );
}

export default function JourneyScreen({
  gameState,
  settings,
  onBuyDecoration,
  onPlaceDecoration,
  onRemoveDecoration,
  isPlus,
  exploreBusy,
  onExplore,
  onOpenPlus,
  onUiTap,
}: JourneyScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  const [selectedDay, setSelectedDay] = useState<DayRecord | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<number | null>(null);
  const [decorationsVisible, setDecorationsVisible] = useState(false);

  const tiles = getActiveDayRecords(gameState.days);
  const position = getRoadPosition(gameState.days);
  const region = REGIONS[position.regionIndex];
  const companion = getActiveCompanion(gameState);
  const todayActive =
    tiles.length > 0 &&
    tiles[tiles.length - 1].date === getStartOfDay(Date.now());
  const formatDay = (date: number) =>
    new Date(date).toLocaleDateString(locale, { day: "numeric", month: "short" });

  // Newest first: the companion's current tile sits at the top of the screen.
  const roadItems: React.ReactNode[] = [];
  for (let index = tiles.length - 1; index >= 0; index -= 1) {
    const day = tiles[index];
    const tileRegion = REGIONS[getRegionForTile(index).regionIndex];

    if ((index + 1) % TILES_PER_CAMP === 0) {
      const campIndex = (index + 1) / TILES_PER_CAMP - 1;
      roadItems.push(
        <CampCard
          key={`camp-${campIndex}`}
          campIndex={campIndex}
          decorations={gameState.decorations}
          settings={settings}
          onPress={() => {
            setSelectedCamp(campIndex);
            onUiTap();
          }}
        />,
      );
    }

    roadItems.push(
      <View
        key={`tile-${day.date}`}
        style={[
          styles.tileRow,
          { marginLeft: WIND_OFFSETS[index % WIND_OFFSETS.length] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tile,
            {
              backgroundColor: tileRegion.color,
              borderColor: tileRegion.borderColor,
            },
          ]}
          onPress={() => {
            setSelectedDay(day);
            onUiTap();
          }}
          activeOpacity={0.85}
        >
          <ImageBackground
            source={getRegionImages(tileRegion.id).tile}
            style={styles.tileInner}
            imageStyle={styles.tileImage}
          >
            <View style={styles.tileIcons}>
              {getTileFeatures(day).map((feature, featureIndex) => (
                <FeatureIcon key={`${feature}-${featureIndex}`} feature={feature} size={20} />
              ))}
            </View>
            <Text style={styles.tileDate}>{formatDay(day.date)}</Text>
          </ImageBackground>
        </TouchableOpacity>
        {index === tiles.length - 1 && companion && (
          <Image
            source={getPetImage(
              companion.templateId,
              companion.evolutionStage,
              companion.activeImageVariantId,
            )}
            style={styles.tileCompanion}
            resizeMode="contain"
          />
        )}
      </View>,
    );

    if (index % TILES_PER_REGION === 0) {
      const regionNumber = index / TILES_PER_REGION;
      roadItems.push(
        <View
          key={`region-${regionNumber}`}
          style={[styles.regionBanner, { backgroundColor: tileRegion.borderColor }]}
        >
          <Text style={styles.regionBannerText}>
            {fill(copy.journeyRegion, {
              number: regionNumber + 1,
              name: tileRegion.name,
            })}
          </Text>
        </View>,
      );
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ImageBackground
        source={getRegionImages(region.id).banner}
        style={[
          styles.header,
          { backgroundColor: region.color, borderBottomColor: region.borderColor },
        ]}
      >
        <View style={styles.headerShade} />
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{region.name}</Text>
            <Text style={styles.headerSeason}>
              {copy.journeyTitle} • {fill(copy.journeySeason, { season: position.season })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              setDecorationsVisible(true);
              onUiTap();
            }}
          >
            <Text style={styles.headerButtonText}>🎒 {copy.journeyDecorations}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerHint}>
          {copy.regionHints[position.regionIndex]}
        </Text>
        <Text style={styles.headerProgress}>
          {fill(copy.journeyProgress, {
            tiles: position.tiles,
            camp: position.tilesToNextCamp,
            region: position.tilesToNextRegion,
          })}
        </Text>
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.road}>
        <View
          style={[
            styles.nextTile,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Text style={[styles.nextTileText, { color: theme.mutedText }]}>
            {tiles.length === 0
              ? copy.journeyEmpty
              : todayActive
                ? copy.journeyTodayDone
                : copy.journeyNextTile}
          </Text>
        </View>
        {roadItems}
      </ScrollView>

      <DayModal
        day={selectedDay}
        settings={settings}
        onClose={() => {
          setSelectedDay(null);
          onUiTap();
        }}
      />
      <CampModal
        campIndex={selectedCamp}
        gameState={gameState}
        settings={settings}
        onClose={() => {
          setSelectedCamp(null);
          onUiTap();
        }}
        onPlaceDecoration={onPlaceDecoration}
        onRemoveDecoration={onRemoveDecoration}
        isPlus={isPlus}
        onOpenPlus={onOpenPlus}
      />
      <DecorationsModal
        visible={decorationsVisible}
        gameState={gameState}
        settings={settings}
        onClose={() => {
          setDecorationsVisible(false);
          onUiTap();
        }}
        onBuyDecoration={onBuyDecoration}
        isPlus={isPlus}
        exploreBusy={exploreBusy}
        onExplore={onExplore}
      />
    </SafeAreaView>
  );
}

function CampCard({
  campIndex,
  decorations,
  settings,
  onPress,
}: {
  campIndex: number;
  decorations: Decoration[];
  settings: AppSettings;
  onPress: () => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);

  return (
    <TouchableOpacity
      style={[styles.campCard, { backgroundColor: theme.surface, borderColor: theme.warning }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={getRegionImages(getCampRegion(campIndex).id).camp}
        style={styles.campThumb}
        resizeMode="cover"
      />
      <View style={styles.campBody}>
        <Text style={[styles.campTitle, { color: theme.text }]}>
          {fill(copy.journeyCamp, { number: campIndex + 1 })}
        </Text>
        <View style={styles.campSpots}>
          {Array.from({ length: SPOTS_PER_CAMP }, (_, spot) => {
            const placed = decorations.find(
              (decoration) => decoration.camp === campIndex && decoration.spot === spot,
            );
            return <DecorationIcon key={spot} typeId={placed?.typeId} size={26} />;
          })}
        </View>
      </View>
      <Text style={[styles.campChevron, { color: theme.mutedText }]}>›</Text>
    </TouchableOpacity>
  );
}

function SheetModal({
  visible,
  title,
  settings,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  settings: AppSettings;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity
              style={[styles.sheetClose, { backgroundColor: theme.surfaceMuted }]}
              onPress={onClose}
            >
              <Text style={[styles.sheetCloseText, { color: theme.text }]}>
                {copy.journeyClose}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DayModal({
  day,
  settings,
  onClose,
}: {
  day: DayRecord | null;
  settings: AppSettings;
  onClose: () => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  if (!day) {
    return null;
  }

  const features = [...new Set(getTileFeatures(day))] as TileFeature[];
  const shown = day.completions.slice(0, MAX_DAY_ITEMS);
  const hidden = day.done - shown.length;

  return (
    <SheetModal
      visible
      title={new Date(day.date).toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
      settings={settings}
      onClose={onClose}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        {fill(copy.journeyDayDone, { done: day.done })}
      </Text>
      {shown.map((completion, index) => (
        <View
          key={`${completion.at}-${index}`}
          style={[styles.listRow, { backgroundColor: theme.surface }]}
        >
          <Text style={[styles.listRowText, { color: theme.text }]}>{completion.name}</Text>
          <Text style={[styles.listRowMeta, { color: theme.mutedText }]}>
            {new Date(completion.at).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      ))}
      {hidden > 0 && (
        <Text style={[styles.mutedLine, { color: theme.mutedText }]}>
          {fill(copy.journeyDayMore, { count: hidden })}
        </Text>
      )}
      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <FeatureIcon feature={feature} size={22} />
            <Text style={[styles.featureLine, { color: theme.mutedText }]}>
              {copy.tileFeatures[feature]}
            </Text>
          </View>
        ))}
      </View>
    </SheetModal>
  );
}

function CampModal({
  campIndex,
  gameState,
  settings,
  onClose,
  onPlaceDecoration,
  onRemoveDecoration,
  isPlus,
  onOpenPlus,
}: {
  campIndex: number | null;
  gameState: GameState;
  settings: AppSettings;
  onClose: () => void;
  onPlaceDecoration: (decorationId: string, camp: number, spot: number) => void;
  onRemoveDecoration: (decorationId: string) => void;
  isPlus: boolean;
  onOpenPlus: () => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  if (campIndex === null) {
    return null;
  }

  const lookBack = getCampLookBack(gameState.days, campIndex);
  const lookBackVisible = isLookBackVisible(campIndex, getRoadPosition(gameState.days).campsReached, isPlus);
  const bag = gameState.decorations.filter(
    (decoration) => !isPlaced(decoration) && getDecorationType(decoration.typeId)?.category !== "furniture",
  );
  const placedAt = (spot: number) =>
    gameState.decorations.find(
      (decoration) => decoration.camp === campIndex && decoration.spot === spot,
    );
  const selectedPlaced = selectedSpot === null ? undefined : placedAt(selectedSpot);
  // One of each type in the bag is enough to choose from.
  const bagChoices = bag.filter(
    (decoration, index) => bag.findIndex((other) => other.typeId === decoration.typeId) === index,
  );
  const close = () => {
    setSelectedSpot(null);
    onClose();
  };

  return (
    <SheetModal
      visible
      title={fill(copy.journeyCamp, { number: campIndex + 1 })}
      settings={settings}
      onClose={close}
    >
      <ImageBackground
        source={getRegionImages(getCampRegion(campIndex).id).camp}
        style={styles.campScene}
        imageStyle={styles.campSceneImage}
      >
        {Array.from({ length: SPOTS_PER_CAMP }, (_, spot) => {
          const placed = placedAt(spot);
          return placed ? (
            <View key={spot} style={[styles.sceneSpot, SCENE_SPOTS[spot]]}>
              <DecorationIcon typeId={placed.typeId} size={64} />
            </View>
          ) : null;
        })}
      </ImageBackground>

      {lookBack && !lookBackVisible && (
        <TouchableOpacity
          style={[styles.lookBack, { backgroundColor: theme.surface }]}
          onPress={onOpenPlus}
        >
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>🔒 {copy.journeyLookBackLocked}</Text>
        </TouchableOpacity>
      )}
      {lookBack && lookBackVisible && (
        <View style={[styles.lookBack, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.journeyLookBack}</Text>
          <Text style={[styles.lookBackLine, { color: theme.text }]}>
            {fill(copy.journeyLookBackDone, { done: lookBack.done })}
          </Text>
          <Text style={[styles.lookBackLine, { color: theme.text }]}>
            {fill(copy.journeyLookBackBusiest, {
              day: new Date(lookBack.busiestDay).toLocaleDateString(locale, {
                weekday: "long",
              }),
            })}
          </Text>
          {lookBack.topTaskName !== "" && (
            <Text style={[styles.lookBackLine, { color: theme.text }]}>
              {fill(copy.journeyLookBackTop, {
                name: lookBack.topTaskName,
                count: lookBack.topTaskCount,
              })}
            </Text>
          )}
        </View>
      )}

      <View style={styles.spotRow}>
        {Array.from({ length: SPOTS_PER_CAMP }, (_, spot) => {
          const placed = placedAt(spot);
          const type = placed ? getDecorationType(placed.typeId) : undefined;
          return (
            <TouchableOpacity
              key={spot}
              style={[
                styles.spot,
                {
                  backgroundColor: theme.surface,
                  borderColor: selectedSpot === spot ? theme.accent : theme.border,
                },
              ]}
              onPress={() => setSelectedSpot(spot)}
            >
              <DecorationIcon typeId={type?.id} size={40} />
              <Text style={[styles.spotLabel, { color: theme.mutedText }]} numberOfLines={1}>
                {placed ? getDecorationName(copy, placed.typeId) : copy.journeyEmptySpot}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedSpot !== null && selectedPlaced && (
        <TouchableOpacity
          style={[styles.wideButton, { backgroundColor: theme.surfaceMuted }]}
          onPress={() => onRemoveDecoration(selectedPlaced.id)}
        >
          <Text style={[styles.wideButtonText, { color: theme.text }]}>{copy.journeyPutBack}</Text>
        </TouchableOpacity>
      )}

      {selectedSpot !== null && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {copy.journeyChooseForSpot}
          </Text>
          {bagChoices.length === 0 ? (
            <Text style={[styles.mutedLine, { color: theme.mutedText }]}>{copy.journeyBagEmpty}</Text>
          ) : (
            bagChoices.map((decoration) => (
              <View
                key={decoration.id}
                style={[styles.listRow, { backgroundColor: theme.surface }]}
              >
                <DecorationIcon typeId={decoration.typeId} size={32} />
                <Text style={[styles.listRowText, { color: theme.text }]}>
                  {getDecorationName(copy, decoration.typeId)}
                </Text>
                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: theme.accent }]}
                  onPress={() => onPlaceDecoration(decoration.id, campIndex, selectedSpot)}
                >
                  <Text style={[styles.smallButtonText, { color: theme.accentText }]}>
                    {copy.journeyPlaceHere}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </>
      )}
    </SheetModal>
  );
}

function DecorationsModal({
  visible,
  gameState,
  settings,
  onClose,
  onBuyDecoration,
  isPlus,
  exploreBusy,
  onExplore,
}: {
  visible: boolean;
  gameState: GameState;
  settings: AppSettings;
  onClose: () => void;
  onBuyDecoration: (typeId: string) => void;
  isPlus: boolean;
  exploreBusy: boolean;
  onExplore: () => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const explorer = getActiveCompanion(gameState);
  if (!visible) {
    return null;
  }

  const bagCounts = new Map<string, number>();
  gameState.decorations
    .filter((decoration) => !isPlaced(decoration))
    .forEach((decoration) =>
      bagCounts.set(decoration.typeId, (bagCounts.get(decoration.typeId) ?? 0) + 1),
    );

  return (
    <SheetModal
      visible
      title={`${copy.journeyDecorations} • ${formatCount(gameState.coins, getLocaleFromSettings(settings))} 🪙`}
      settings={settings}
      onClose={onClose}
    >
      {explorer && (
        <ExploreButton
          settings={settings}
          companionName={explorer.name}
          left={getExploreLeft(gameState.explore, Date.now())}
          isPlus={isPlus}
          busy={exploreBusy}
          onPress={onExplore}
        />
      )}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.journeyBag}</Text>
      {bagCounts.size === 0 ? (
        <Text style={[styles.mutedLine, { color: theme.mutedText }]}>{copy.journeyBagEmpty}</Text>
      ) : (
        <View style={styles.bagGrid}>
          {[...bagCounts.entries()].map(([typeId, count]) => (
            <View key={typeId} style={[styles.bagItem, { backgroundColor: theme.surface }]}>
              <DecorationIcon typeId={typeId} size={40} />
              <Text style={[styles.spotLabel, { color: theme.mutedText }]} numberOfLines={1}>
                {getDecorationName(copy, typeId)}
                {count > 1 ? ` ×${count}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.journeyShop}</Text>
      {DECORATION_TYPES.filter((type) => type.category !== "furniture").map((type) => {
        const affordable = gameState.coins >= type.price;
        return (
          <View key={type.id} style={[styles.listRow, { backgroundColor: theme.surface }]}>
            <DecorationIcon typeId={type.id} size={32} />
            <Text style={[styles.listRowText, { color: theme.text }]}>
              {getDecorationName(copy, type.id)}
            </Text>
            {type.price > 0 ? (
              <TouchableOpacity
                style={[
                  styles.smallButton,
                  { backgroundColor: affordable ? theme.accent : theme.border },
                ]}
                onPress={() => onBuyDecoration(type.id)}
                disabled={!affordable}
              >
                <Text
                  style={[
                    styles.smallButtonText,
                    { color: affordable ? theme.accentText : theme.mutedText },
                  ]}
                >
                  {fill(copy.journeyBuy, { price: type.price })}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.listRowMeta, { color: theme.mutedText }]}>
                {copy.journeyFoundOnly}
              </Text>
            )}
          </View>
        );
      })}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 3,
  },
  headerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSeason: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  headerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  headerHint: {
    fontSize: 13,
    color: "#fff",
    marginTop: 10,
  },
  headerProgress: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 6,
  },
  road: {
    padding: 16,
    paddingBottom: 48,
    gap: 10,
  },
  nextTile: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 14,
  },
  nextTileText: {
    fontSize: 13,
    textAlign: "center",
  },
  tileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tile: {
    width: 150,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 3,
    overflow: "hidden",
  },
  tileInner: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "space-between",
  },
  tileImage: {
    borderRadius: 13,
  },
  tileIcons: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "flex-start",
    gap: 1,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  tileDate: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tileCompanion: {
    width: 64,
    height: 64,
  },
  regionBanner: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  regionBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  campCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
  },
  campThumb: {
    width: 72,
    height: 48,
    borderRadius: 10,
  },
  campBody: {
    flex: 1,
  },
  campTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  campSpots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  campScene: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  campSceneImage: {
    borderRadius: 14,
  },
  sceneSpot: {
    position: "absolute",
  },
  campChevron: {
    fontSize: 26,
    fontWeight: "300",
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  sheetClose: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sheetCloseText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sheetContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  listRowText: {
    flex: 1,
    fontSize: 14,
  },
  listRowMeta: {
    fontSize: 12,
  },
  mutedLine: {
    fontSize: 13,
  },
  featureList: {
    gap: 4,
    marginTop: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureLine: {
    fontSize: 13,
  },
  lookBack: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  lookBackLine: {
    fontSize: 14,
  },
  spotRow: {
    flexDirection: "row",
    gap: 10,
  },
  spot: {
    flex: 1,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  spotLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  wideButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  wideButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  smallButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bagItem: {
    width: 96,
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
});
