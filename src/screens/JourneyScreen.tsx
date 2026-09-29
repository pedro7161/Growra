import React, { useState } from "react";
import {
  Image,
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
  TILE_FEATURE_ICONS,
  TILES_PER_CAMP,
  TILES_PER_REGION,
  TileFeature,
} from "../utils/journey";
import { getLocaleFromSettings } from "../utils/settings";
import { getStartOfDay } from "../utils/taskSchedule";

interface JourneyScreenProps {
  gameState: GameState;
  settings: AppSettings;
  onBuyDecoration: (typeId: string) => void;
  onPlaceDecoration: (decorationId: string, camp: number, spot: number) => void;
  onRemoveDecoration: (decorationId: string) => void;
}

/** Horizontal offsets that make the road wind left and right. */
const WIND_OFFSETS = [0, 44, 88, 44];
const MAX_DAY_ITEMS = 12;

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

export default function JourneyScreen({
  gameState,
  settings,
  onBuyDecoration,
  onPlaceDecoration,
  onRemoveDecoration,
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
          onPress={() => setSelectedCamp(campIndex)}
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
          onPress={() => setSelectedDay(day)}
          activeOpacity={0.85}
        >
          <Text style={styles.tileIcons}>
            {getTileFeatures(day)
              .map((feature) => TILE_FEATURE_ICONS[feature])
              .join("")}
          </Text>
          <Text style={styles.tileDate}>{formatDay(day.date)}</Text>
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
      <View
        style={[
          styles.header,
          { backgroundColor: region.color, borderBottomColor: region.borderColor },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{region.name}</Text>
            <Text style={styles.headerSeason}>
              {copy.journeyTitle} • {fill(copy.journeySeason, { season: position.season })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setDecorationsVisible(true)}
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
      </View>

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
        onClose={() => setSelectedDay(null)}
      />
      <CampModal
        campIndex={selectedCamp}
        gameState={gameState}
        settings={settings}
        onClose={() => setSelectedCamp(null)}
        onPlaceDecoration={onPlaceDecoration}
        onRemoveDecoration={onRemoveDecoration}
      />
      <DecorationsModal
        visible={decorationsVisible}
        gameState={gameState}
        settings={settings}
        onClose={() => setDecorationsVisible(false)}
        onBuyDecoration={onBuyDecoration}
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
      <Text style={styles.campFire}>🔥</Text>
      <View style={styles.campBody}>
        <Text style={[styles.campTitle, { color: theme.text }]}>
          {fill(copy.journeyCamp, { number: campIndex + 1 })}
        </Text>
        <Text style={[styles.campSpots, { color: theme.mutedText }]}>
          {Array.from({ length: SPOTS_PER_CAMP }, (_, spot) => {
            const placed = decorations.find(
              (decoration) => decoration.camp === campIndex && decoration.spot === spot,
            );
            return placed ? getDecorationType(placed.typeId)?.icon ?? "◌" : "◌";
          }).join("  ")}
        </Text>
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
          <Text key={feature} style={[styles.featureLine, { color: theme.mutedText }]}>
            {TILE_FEATURE_ICONS[feature]}  {copy.tileFeatures[feature]}
          </Text>
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
}: {
  campIndex: number | null;
  gameState: GameState;
  settings: AppSettings;
  onClose: () => void;
  onPlaceDecoration: (decorationId: string, camp: number, spot: number) => void;
  onRemoveDecoration: (decorationId: string) => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const locale = getLocaleFromSettings(settings);
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  if (campIndex === null) {
    return null;
  }

  const lookBack = getCampLookBack(gameState.days, campIndex);
  const bag = gameState.decorations.filter((decoration) => !isPlaced(decoration));
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
      title={`🔥 ${fill(copy.journeyCamp, { number: campIndex + 1 })}`}
      settings={settings}
      onClose={close}
    >
      {lookBack && (
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
              <Text style={styles.spotIcon}>{type ? type.icon : "◌"}</Text>
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
                <Text style={[styles.listRowText, { color: theme.text }]}>
                  {getDecorationType(decoration.typeId)?.icon}{"  "}
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
}: {
  visible: boolean;
  gameState: GameState;
  settings: AppSettings;
  onClose: () => void;
  onBuyDecoration: (typeId: string) => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
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
      title={`${copy.journeyDecorations} • ${gameState.coins} 🪙`}
      settings={settings}
      onClose={onClose}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.journeyBag}</Text>
      {bagCounts.size === 0 ? (
        <Text style={[styles.mutedLine, { color: theme.mutedText }]}>{copy.journeyBagEmpty}</Text>
      ) : (
        <View style={styles.bagGrid}>
          {[...bagCounts.entries()].map(([typeId, count]) => (
            <View key={typeId} style={[styles.bagItem, { backgroundColor: theme.surface }]}>
              <Text style={styles.spotIcon}>{getDecorationType(typeId)?.icon}</Text>
              <Text style={[styles.spotLabel, { color: theme.mutedText }]} numberOfLines={1}>
                {getDecorationName(copy, typeId)}
                {count > 1 ? ` ×${count}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.journeyShop}</Text>
      {DECORATION_TYPES.map((type) => {
        const affordable = gameState.coins >= type.price;
        return (
          <View key={type.id} style={[styles.listRow, { backgroundColor: theme.surface }]}>
            <Text style={[styles.listRowText, { color: theme.text }]}>
              {type.icon}{"  "}
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  tileIcons: {
    fontSize: 16,
    letterSpacing: 1,
  },
  tileDate: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
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
  campFire: {
    fontSize: 28,
  },
  campBody: {
    flex: 1,
  },
  campTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  campSpots: {
    fontSize: 18,
    marginTop: 4,
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
  spotIcon: {
    fontSize: 28,
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
