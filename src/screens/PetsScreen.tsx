import React, { useEffect, useState } from "react";
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAppCopy } from "../constants/appCopy";
import { getAppTheme } from "../constants/appTheme";
import { getPetImage } from "../constants/petImages";
import { AppSettings, GameState, PetRarity } from "../types";
import {
    EXPEDITION_MAP_REGIONS,
    getBattleConsumableKindLabel,
    getExpeditionBattlePreview,
    getExpeditionDurationMs,
    getExpeditionMapRegionCount,
    getExpeditionNodeDurationMs,
    getExpeditionSideNodeById,
    getExpeditionZoneBlueprints,
    getFuseSourcePets,
    getLevelProgress,
    getNextEvolutionFusionTarget,
    getPetElement,
    getPetTemplates,
    getPityCost,
    getSellablePets,
    getSellValue,
    isExpeditionNodeCompleted,
    MAX_PET_FUSIONS,
    MULTI_SUMMON_COST,
    PET_LEVEL_BASE_COST,
    previewExpeditionBattleOutcome,
    SUMMON_COST,
} from "../utils/gameplay";

interface PetsScreenProps {
  gameState: GameState;
  settings: AppSettings;
  tutorialMode: "summon" | "equip" | null;
  onEquipPet: (petId: string) => void;
  onFusePet: (targetPetId: string, sourcePetId: string) => void;
  onRedeemPityPet: (templateId: string) => void;
  onSellPet: (petId: string) => void;
  onFightZone: (
    zoneIndex: number,
    petId: string,
    battleConsumableIds: string[],
  ) => void;
  onExploreNode: (nodeId: string, petId: string) => void;
  onEquipGear: (gearItemId: string, petId: string) => void;
  onSendPetOnExpedition: (petId: string) => void;
  onSummonPet: () => void;
  onMultiSummonPet: () => void;
}

const EXPEDITION_REGIONS = getExpeditionZoneBlueprints();
const MAP_CANVAS_WIDTH = 2200;
const MAP_CANVAS_HEIGHT = 720;

export default function PetsScreen({
  gameState,
  settings,
  tutorialMode,
  onEquipPet,
  onFusePet,
  onRedeemPityPet,
  onSellPet,
  onFightZone,
  onExploreNode,
  onEquipGear,
  onSendPetOnExpedition,
  onSummonPet,
  onMultiSummonPet,
}: PetsScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [now, setNow] = useState(Date.now());
  const [selectedPetId, setSelectedPetId] = useState("");
  const [mapExpandedVisible, setMapExpandedVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "my-pets" | "exploration" | "summon"
  >("my-pets");
  const [myPetsSubTab, setMyPetsSubTab] = useState<"box" | "fuse" | "gear">(
    "box",
  );
  const [summonSubTab, setSummonSubTab] = useState<
    "banner" | "pityshop" | "sell"
  >("banner");
  const petTemplates = getPetTemplates();
  const sellablePets = getSellablePets(gameState);
  const expeditionProgress = gameState.expeditionProgress;
  const activeExpedition = expeditionProgress.activeZoneIndex >= 0;
  const revealedRegions = getExpeditionMapRegionCount(expeditionProgress);
  const battleZoneIndex = revealedRegions > 0 ? revealedRegions - 1 : 0;
  const canBattle = revealedRegions > 0;
  const tutorialOn = tutorialMode !== null;
  const summonBannerTarget =
    tutorialMode === "summon" &&
    activeTab === "summon" &&
    summonSubTab !== "banner";
  const summonButtonTarget =
    tutorialMode === "summon" &&
    activeTab === "summon" &&
    summonSubTab === "banner";
  useEffect(() => {
    if (selectedPetId === "") {
      return;
    }

    const selectedPet = gameState.pets.filter(
      (pet) => pet.id === selectedPetId,
    )[0];

    if (selectedPet) {
      return;
    }

    setSelectedPetId("");
  }, [gameState, selectedPetId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const formatDuration = (durationMs: number) => {
    const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {copy.petsTitle}
        </Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          {gameState.coins} {copy.petsCoinsPity} • {gameState.pityCurrency} pity
        </Text>
      </View>

      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TabButton
          label={copy.petsMyPetsTab}
          active={activeTab === "my-pets"}
          onPress={() => setActiveTab("my-pets")}
          settings={settings}
          highlighted={tutorialMode === "equip" && activeTab !== "my-pets"}
          disabled={
            tutorialOn && !(tutorialMode === "equip" && activeTab !== "my-pets")
          }
        />
        <TabButton
          label={copy.petsExplorationTab}
          active={activeTab === "exploration"}
          onPress={() => setActiveTab("exploration")}
          settings={settings}
          highlighted={false}
          disabled={tutorialOn}
        />
        <TabButton
          label={copy.petsSummonTab}
          active={activeTab === "summon"}
          onPress={() => setActiveTab("summon")}
          settings={settings}
          highlighted={tutorialMode === "summon" && activeTab !== "summon"}
          disabled={
            tutorialOn && !(tutorialMode === "summon" && activeTab !== "summon")
          }
        />
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "my-pets" && (
          <>
            <View
              style={[
                styles.tabBar,
                {
                  backgroundColor: theme.surface,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <TabButton
                label="Box"
                active={myPetsSubTab === "box"}
                onPress={() => setMyPetsSubTab("box")}
                settings={settings}
                highlighted={
                  tutorialMode === "equip" &&
                  activeTab === "my-pets" &&
                  myPetsSubTab !== "box"
                }
                disabled={
                  tutorialOn &&
                  !(
                    tutorialMode === "equip" &&
                    activeTab === "my-pets" &&
                    myPetsSubTab !== "box"
                  )
                }
              />
              <TabButton
                label="Fuse"
                active={myPetsSubTab === "fuse"}
                onPress={() => setMyPetsSubTab("fuse")}
                settings={settings}
                highlighted={false}
                disabled={tutorialOn}
              />
              <TabButton
                label="Gear"
                active={myPetsSubTab === "gear"}
                onPress={() => setMyPetsSubTab("gear")}
                settings={settings}
                highlighted={false}
                disabled={tutorialOn}
              />
            </View>

            {myPetsSubTab === "box" && (
              <View style={styles.grid}>
                {gameState.pets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    gameState={gameState}
                    petId={pet.id}
                    settings={settings}
                    onPress={() => setSelectedPetId(pet.id)}
                    onEquipPet={onEquipPet}
                    onFusePet={() => {}}
                    hideFuseButton={true}
                    tutorialMode={tutorialMode}
                    tutorialTarget={
                      tutorialMode === "equip" &&
                      activeTab === "my-pets" &&
                      myPetsSubTab === "box" &&
                      pet.id === gameState.pets[0].id
                    }
                  />
                ))}
              </View>
            )}

            {myPetsSubTab === "fuse" && (
              <View style={styles.grid}>
                {gameState.pets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    gameState={gameState}
                    petId={pet.id}
                    settings={settings}
                    onPress={() => setSelectedPetId(pet.id)}
                    onEquipPet={onEquipPet}
                    onFusePet={onFusePet}
                    hideEquipButton={true}
                    tutorialMode={null}
                    tutorialTarget={false}
                  />
                ))}
              </View>
            )}

            {myPetsSubTab === "gear" && (
              <View
                style={[styles.gearVault, { backgroundColor: theme.surface }]}
              >
                <Text
                  style={[styles.detailSectionTitle, { color: theme.text }]}
                >
                  {copy.petsGearTitle}
                </Text>
                <Text style={[styles.shopText, { color: theme.mutedText }]}>
                  {copy.petsGearSubtitle}
                </Text>
                <GearInventoryPanel
                  gameState={gameState}
                  settings={settings}
                  gearItems={gameState.gearItems}
                  activePetId={gameState.equippedPetId}
                  onEquipGear={onEquipGear}
                  emptyText={copy.petsGearNoItems}
                  sourceLabel={copy.petsDetailSource}
                  gearLabel={copy.petsGearLabel}
                  bonusLabel={copy.petsGearBonus}
                  equipLabel={copy.petsGearEquip}
                  equippedLabel={copy.petsGearEquipped}
                  panelTitle=""
                  panelSubtitle=""
                />
              </View>
            )}
          </>
        )}

        {activeTab === "exploration" && (
          <View style={styles.explorationStack}>
            <View
              style={[
                styles.explorationHero,
                { backgroundColor: theme.surface },
              ]}
            >
              <Text style={[styles.shopTitle, { color: theme.text }]}>
                {copy.petsExplorationTitle}
              </Text>
              <Text style={[styles.shopText, { color: theme.mutedText }]}>
                Drag around the full map, branch through side routes, and pick a
                zone to explore or fight.
              </Text>
              <View style={styles.explorationStatsRow}>
                <View
                  style={[
                    styles.explorationStatCard,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.explorationStatLabel,
                      { color: theme.mutedText },
                    ]}
                  >
                    {copy.petsExplorationSent}
                  </Text>
                  <Text
                    style={[styles.explorationStatValue, { color: theme.text }]}
                  >
                    {expeditionProgress.expeditionsSent}
                  </Text>
                </View>
                <View
                  style={[
                    styles.explorationStatCard,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.explorationStatLabel,
                      { color: theme.mutedText },
                    ]}
                  >
                    {copy.petsExplorationMapTitle}
                  </Text>
                  <Text
                    style={[styles.explorationStatValue, { color: theme.text }]}
                  >
                    {revealedRegions}/{EXPEDITION_MAP_REGIONS}
                  </Text>
                </View>
                <View
                  style={[
                    styles.explorationStatCard,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.explorationStatLabel,
                      { color: theme.mutedText },
                    ]}
                  >
                    Map zones
                  </Text>
                  <Text
                    style={[styles.explorationStatValue, { color: theme.text }]}
                  >
                    {EXPEDITION_MAP_REGIONS}
                  </Text>
                </View>
              </View>
              <Text style={[styles.shopText, { color: theme.mutedText }]}>
                The map expands into a pannable board with locked zones, side
                branches, and pet-gated paths.
              </Text>
              {activeExpedition && (
                <View
                  style={[
                    styles.activeExpeditionCard,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.activeExpeditionLabel,
                      { color: theme.mutedText },
                    ]}
                  >
                    {copy.petsExplorationActive}
                  </Text>
                  <Text
                    style={[
                      styles.activeExpeditionValue,
                      { color: theme.text },
                    ]}
                  >
                    {copy.petsExplorationNextZone}:{" "}
                    {expeditionProgress.activeZoneIndex + 1}/
                    {EXPEDITION_MAP_REGIONS}
                  </Text>
                  <Text
                    style={[
                      styles.activeExpeditionValue,
                      { color: theme.text },
                    ]}
                  >
                    {copy.petsExplorationTimeRemaining}:{" "}
                    {formatDuration(expeditionProgress.activeZoneEndsAt - now)}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.mapOpenButton, { backgroundColor: theme.hero }]}
                onPress={() => setMapExpandedVisible(true)}
              >
                <Text
                  style={[styles.mapOpenButtonText, { color: theme.heroText }]}
                >
                  Open world map
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "summon" && (
          <>
            <View
              style={[
                styles.tabBar,
                {
                  backgroundColor: theme.surface,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <TabButton
                label="Banner"
                active={summonSubTab === "banner"}
                onPress={() => setSummonSubTab("banner")}
                settings={settings}
                highlighted={summonBannerTarget}
                disabled={tutorialOn && !summonBannerTarget}
              />
              <TabButton
                label="Pity Shop"
                active={summonSubTab === "pityshop"}
                onPress={() => setSummonSubTab("pityshop")}
                settings={settings}
                highlighted={false}
                disabled={tutorialOn}
              />
              <TabButton
                label="Sell"
                active={summonSubTab === "sell"}
                onPress={() => setSummonSubTab("sell")}
                settings={settings}
                highlighted={false}
                disabled={tutorialOn}
              />
            </View>

            {summonSubTab === "banner" && (
              <View
                style={[styles.shopCard, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.shopTitle, { color: theme.text }]}>
                  {copy.petsGachaTitle}
                </Text>
                <Text style={[styles.shopText, { color: theme.mutedText }]}>
                  {copy.petsGachaOdds}
                </Text>
                <Text style={[styles.shopText, { color: theme.mutedText }]}>
                  {copy.petsGachaSecret}
                </Text>
                <Text style={[styles.shopText, { color: theme.mutedText }]}>
                  {copy.petsGachaCost.replace("{cost}", String(SUMMON_COST))}
                </Text>
                <Text style={[styles.shopText, { color: theme.mutedText }]}>
                  {copy.petsGachaMultiCost.replace(
                    "{cost}",
                    String(MULTI_SUMMON_COST),
                  )}
                </Text>
              </View>
            )}

            {summonSubTab === "pityshop" && (
              <View
                style={[styles.shopCard, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.shopTitle, { color: theme.text }]}>
                  {copy.petsPityShopTitle}
                </Text>
                <Text style={[styles.shopText, { color: theme.mutedText }]}>
                  {copy.petsPityShopSubtitle}
                </Text>
                <View style={styles.pityGrid}>
                  {petTemplates.map((template) => (
                    <View
                      key={template.id}
                      style={[
                        styles.pityCard,
                        {
                          backgroundColor: theme.surfaceMuted,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Image
                        source={getPetImage(template.id, 0, "default")}
                        style={styles.pityPetImage}
                        resizeMode="contain"
                      />
                      <View style={styles.pityCardHeader}>
                        <Text style={[styles.pityName, { color: theme.text }]}>
                          {template.name}
                        </Text>
                        <Text
                          style={[
                            styles.pityRarity,
                            { color: theme.mutedText },
                          ]}
                        >
                          {template.rarity}
                        </Text>
                      </View>
                      <Text
                        style={[styles.pityMeta, { color: theme.mutedText }]}
                      >
                        +{(template.taskMultiplier * 100).toFixed(0)}%{" "}
                        {copy.petsTaskBonus.toLowerCase()}
                      </Text>
                      <Text
                        style={[styles.pityMeta, { color: theme.mutedText }]}
                      >
                        {copy.petsCost}: {getPityCost(template.rarity)} pity
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.redeemButton,
                          { backgroundColor: theme.warning },
                          gameState.pityCurrency <
                            getPityCost(template.rarity) && {
                            backgroundColor: theme.warningSoft,
                          },
                        ]}
                        onPress={() => onRedeemPityPet(template.id)}
                        disabled={
                          gameState.pityCurrency < getPityCost(template.rarity)
                        }
                      >
                        <Text style={styles.redeemButtonText}>
                          {copy.petsClaim}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {summonSubTab === "sell" && (
              <View
                style={[styles.shopCard, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.shopTitle, { color: theme.text }]}>
                  {copy.petsSellShopTitle}
                </Text>
                <Text style={[styles.shopText, { color: theme.mutedText }]}>
                  {copy.petsSellShopSubtitle}
                </Text>
                <View style={styles.sellList}>
                  {sellablePets.length === 0 ? (
                    <Text
                      style={[styles.emptyText, { color: theme.mutedText }]}
                    >
                      {copy.petsNoExtraCopies}
                    </Text>
                  ) : (
                    sellablePets.map((pet) => (
                      <View
                        key={pet.id}
                        style={[
                          styles.sellCard,
                          {
                            backgroundColor: theme.surfaceMuted,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <View>
                          <Text
                            style={[styles.sellName, { color: theme.text }]}
                          >
                            {pet.name}
                          </Text>
                          <Text
                            style={[
                              styles.sellMeta,
                              { color: theme.mutedText },
                            ]}
                          >
                            {pet.rarity} • {copy.petsSellsFor}{" "}
                            {getSellValue(pet.rarity)} {copy.petsCoinsPity}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.sellButton,
                            { backgroundColor: theme.danger },
                          ]}
                          onPress={() => onSellPet(pet.id)}
                        >
                          <Text style={styles.sellButtonText}>
                            {copy.petsSell}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <PetDetailModal
        visible={selectedPetId !== ""}
        gameState={gameState}
        settings={settings}
        petId={selectedPetId}
        canBattle={canBattle}
        battleZoneIndex={battleZoneIndex}
        activeExpedition={activeExpedition}
        onClose={() => setSelectedPetId("")}
        onEquipPet={onEquipPet}
        onEquipGear={onEquipGear}
        onFightZone={onFightZone}
        onFusePet={onFusePet}
        onSellPet={onSellPet}
        onSendPetOnExpedition={onSendPetOnExpedition}
      />

      <MapExplorerModal
        visible={mapExpandedVisible}
        gameState={gameState}
        settings={settings}
        onClose={() => setMapExpandedVisible(false)}
        onFightZone={onFightZone}
        onExploreNode={onExploreNode}
        onSendPetOnExpedition={onSendPetOnExpedition}
      />

      {activeTab === "summon" && summonSubTab === "banner" && (
        <View style={styles.footer}>
          <View style={styles.gachaRow}>
            <TouchableOpacity
              style={[
                styles.gachaButton,
                { backgroundColor: theme.accent },
                gameState.coins < SUMMON_COST && {
                  backgroundColor: theme.border,
                },
                summonButtonTarget && styles.tutorialHighlight,
                tutorialOn && !summonButtonTarget && styles.tutorialDisabled,
              ]}
              onPress={onSummonPet}
              disabled={
                gameState.coins < SUMMON_COST ||
                (tutorialOn && !summonButtonTarget)
              }
            >
              <Text style={styles.gachaButtonText}>
                {copy.petsSummonButton.replace("{cost}", String(SUMMON_COST))}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.gachaButton,
                { backgroundColor: theme.hero },
                gameState.coins < MULTI_SUMMON_COST && {
                  backgroundColor: theme.border,
                },
                tutorialOn && styles.tutorialDisabled,
              ]}
              onPress={onMultiSummonPet}
              disabled={gameState.coins < MULTI_SUMMON_COST || tutorialOn}
            >
              <Text style={styles.gachaButtonText}>
                {copy.petsMultiSummonButton.replace(
                  "{cost}",
                  String(MULTI_SUMMON_COST),
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function PetCard({
  gameState,
  petId,
  settings,
  onPress,
  onEquipPet,
  onFusePet,
  hideEquipButton = false,
  hideFuseButton = false,
  tutorialMode,
  tutorialTarget,
}: {
  gameState: GameState;
  petId: string;
  settings: AppSettings;
  onPress: () => void;
  onEquipPet: (petId: string) => void;
  onFusePet: (targetPetId: string, sourcePetId: string) => void;
  hideEquipButton?: boolean;
  hideFuseButton?: boolean;
  tutorialMode: "summon" | "equip" | null;
  tutorialTarget: boolean;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const pet = gameState.pets.filter((currentPet) => currentPet.id === petId)[0];
  const fuseSourcePets = getFuseSourcePets(gameState, petId);
  const availableFuseCopies =
    pet.fusionLevel < MAX_PET_FUSIONS ? fuseSourcePets : [];
  const firstFuseCopy = availableFuseCopies[0];
  const nextEvolutionFusionTarget = getNextEvolutionFusionTarget(
    pet.fusionLevel,
  );
  const evolutionLabel =
    pet.evolutionStage === 2
      ? copy.petsEvolutionAscended
      : pet.evolutionStage === 1
        ? copy.petsEvolutionEvolved
        : copy.petsEvolutionBase;
  const petXpProgress = getLevelProgress(pet.experience, PET_LEVEL_BASE_COST);
  const equippedGear = gameState.gearItems.filter(
    (gearItem) => gearItem.id === pet.equippedGearId,
  )[0];

  return (
    <TouchableOpacity
      style={[
        styles.petCard,
        { backgroundColor: theme.surface },
        tutorialTarget && styles.tutorialHighlight,
        tutorialMode !== null && !tutorialTarget && styles.tutorialDisabled,
      ]}
      onPress={tutorialMode === null ? onPress : undefined}
      activeOpacity={0.9}
    >
      <Image
        source={getPetImage(
          pet.templateId,
          pet.evolutionStage,
          pet.activeImageVariantId,
        )}
        style={styles.petCardImage}
        resizeMode="contain"
      />
      <View style={styles.petCardHeader}>
        <View>
          <Text style={[styles.petName, { color: theme.text }]}>
            {pet.name}
          </Text>
          <Text style={[styles.petMeta, { color: theme.mutedText }]}>
            {pet.rarity} • {copy.petsLevel.toLowerCase()} {pet.level}
          </Text>
        </View>
        {pet.equipped && (
          <Text
            style={[
              styles.equippedBadge,
              { backgroundColor: theme.accentSoft, color: theme.accent },
            ]}
          >
            {copy.petsActive}
          </Text>
        )}
      </View>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {copy.petsExperience}: {pet.experience}
      </Text>
      <View
        style={[
          styles.xpProgressTrack,
          { backgroundColor: theme.surfaceMuted },
        ]}
      >
        <View
          style={[
            styles.xpProgressFill,
            {
              width: `${Math.round(petXpProgress * 100)}%`,
              backgroundColor: theme.accent,
            },
          ]}
        />
      </View>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {copy.petsFusion}: {pet.fusionLevel}/{MAX_PET_FUSIONS}
      </Text>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {copy.petsEvolution}: {evolutionLabel}
      </Text>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {copy.petsTaskBonus}: +{(pet.taskMultiplier * 100).toFixed(0)}%
      </Text>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {copy.petsGearLabel}:{" "}
        {equippedGear ? equippedGear.name : copy.petsExplorationUnknown}
      </Text>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        ATK {pet.stats.attack} • DEF {pet.stats.defense} • SPD {pet.stats.speed}{" "}
        • LCK {pet.stats.luck}
      </Text>
      <View style={styles.powerRow}>
        <View
          style={[styles.powerCard, { backgroundColor: theme.surfaceMuted }]}
        >
          <Text style={[styles.powerLabel, { color: theme.mutedText }]}>
            {copy.petsCombatPower}
          </Text>
          <Text style={[styles.powerValue, { color: theme.text }]}>
            {pet.combatPower}
          </Text>
        </View>
        <View
          style={[styles.powerCard, { backgroundColor: theme.surfaceMuted }]}
        >
          <Text style={[styles.powerLabel, { color: theme.mutedText }]}>
            {copy.petsExplorationPower}
          </Text>
          <Text style={[styles.powerValue, { color: theme.text }]}>
            {pet.explorationPower}
          </Text>
        </View>
      </View>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {copy.petsAvailableCopies}: {availableFuseCopies.length}
      </Text>
      <Text style={[styles.petStat, { color: theme.mutedText }]}>
        {nextEvolutionFusionTarget
          ? `${copy.petsNextEvolution}: ${pet.fusionLevel}/${nextEvolutionFusionTarget}`
          : copy.petsMaxEvolution}
      </Text>
      <View style={styles.petActions}>
        {!hideEquipButton && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.accent },
              pet.equipped && { backgroundColor: theme.border },
              tutorialTarget && styles.tutorialTargetButton,
            ]}
            onPress={() => onEquipPet(pet.id)}
            disabled={
              pet.equipped || (tutorialMode !== null && !tutorialTarget)
            }
          >
            <Text style={styles.actionButtonText}>
              {pet.equipped ? copy.petsActive : copy.petsEquip}
            </Text>
          </TouchableOpacity>
        )}
        {!hideFuseButton && (
          <TouchableOpacity
            style={[
              styles.fuseButton,
              { backgroundColor: theme.hero },
              !firstFuseCopy && { backgroundColor: theme.border },
              tutorialMode !== null && styles.tutorialDisabled,
            ]}
            onPress={
              firstFuseCopy
                ? () => onFusePet(pet.id, firstFuseCopy.id)
                : undefined
            }
            disabled={!firstFuseCopy || tutorialMode !== null}
          >
            <Text style={styles.fuseButtonText}>{copy.petsFuseCopy}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getGearFlavorText(gearItem: GameState["gearItems"][number]): string {
  const sourceZone =
    EXPEDITION_REGIONS[
      Math.min(gearItem.sourceZoneIndex, EXPEDITION_REGIONS.length - 1)
    ];

  if (gearItem.rarity === PetRarity.LEGENDARY) {
    return `A legendary relic recovered from ${sourceZone.name}.`;
  }

  if (gearItem.rarity === PetRarity.EPIC) {
    return `A powerful trophy recovered from ${sourceZone.name}.`;
  }

  if (gearItem.rarity === PetRarity.RARE) {
    return `A refined piece of adventuring gear recovered from ${sourceZone.name}.`;
  }

  return `A practical piece of gear recovered from ${sourceZone.name}.`;
}

function GearInventoryPanel({
  gameState,
  settings,
  gearItems,
  activePetId,
  onEquipGear,
  emptyText,
  sourceLabel,
  gearLabel,
  bonusLabel,
  equipLabel,
  equippedLabel,
  panelTitle,
  panelSubtitle,
}: {
  gameState: GameState;
  settings: AppSettings;
  gearItems: GameState["gearItems"];
  activePetId: string;
  onEquipGear: (gearItemId: string, petId: string) => void;
  emptyText: string;
  sourceLabel: string;
  gearLabel: string;
  bonusLabel: string;
  equipLabel: string;
  equippedLabel: string;
  panelTitle: string;
  panelSubtitle: string;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [selectedGearId, setSelectedGearId] = useState(
    gearItems.length > 0 ? gearItems[0].id : "",
  );

  useEffect(() => {
    if (gearItems.length === 0) {
      setSelectedGearId("");
      return;
    }

    const selectedGear = gearItems.filter(
      (gearItem) => gearItem.id === selectedGearId,
    )[0];

    if (selectedGear) {
      return;
    }

    setSelectedGearId(gearItems[0].id);
  }, [gearItems, selectedGearId]);

  const selectedGear = gearItems.filter(
    (gearItem) => gearItem.id === selectedGearId,
  )[0];

  return (
    <View style={styles.gearInventoryShell}>
      {panelTitle !== "" && (
        <View style={styles.gearInventoryHeader}>
          <Text style={[styles.gearInventoryTitle, { color: theme.text }]}>
            {panelTitle}
          </Text>
          <Text
            style={[styles.gearInventorySubtitle, { color: theme.mutedText }]}
          >
            {panelSubtitle}
          </Text>
        </View>
      )}

      {gearItems.length === 0 ? (
        <View
          style={[
            styles.detailEmptyCard,
            { backgroundColor: theme.surfaceMuted },
          ]}
        >
          <Text style={[styles.detailEmptyText, { color: theme.mutedText }]}>
            {emptyText}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.gearInventorySummaryRow}>
            <View
              style={[
                styles.gearInventorySummaryCard,
                { backgroundColor: theme.surfaceMuted },
              ]}
            >
              <Text
                style={[
                  styles.gearInventorySummaryLabel,
                  { color: theme.mutedText },
                ]}
              >
                Items
              </Text>
              <Text
                style={[
                  styles.gearInventorySummaryValue,
                  { color: theme.text },
                ]}
              >
                {gearItems.length}
              </Text>
            </View>
            <View
              style={[
                styles.gearInventorySummaryCard,
                { backgroundColor: theme.surfaceMuted },
              ]}
            >
              <Text
                style={[
                  styles.gearInventorySummaryLabel,
                  { color: theme.mutedText },
                ]}
              >
                Selected
              </Text>
              <Text
                style={[
                  styles.gearInventorySummaryValue,
                  { color: theme.text },
                ]}
              >
                {selectedGear ? selectedGear.name : copy.petsExplorationUnknown}
              </Text>
            </View>
          </View>

          <View style={styles.gearInventoryGrid}>
            {gearItems.map((gearItem) => {
              const equippedPet = gameState.pets.filter(
                (pet) => pet.id === gearItem.equippedPetId,
              )[0];
              const selected = gearItem.id === selectedGearId;

              return (
                <TouchableOpacity
                  key={gearItem.id}
                  style={[
                    styles.gearInventoryCard,
                    {
                      backgroundColor: selected
                        ? theme.accentSoft
                        : theme.surfaceMuted,
                      borderColor: selected ? theme.accent : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedGearId(gearItem.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.gearInventoryCardHeader}>
                    <Text
                      style={[styles.gearInventoryName, { color: theme.text }]}
                    >
                      {gearItem.name}
                    </Text>
                    <Text
                      style={[
                        styles.gearInventoryRarity,
                        { color: theme.mutedText },
                      ]}
                    >
                      {gearLabel} • {gearItem.rarity}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.gearInventoryMeta,
                      { color: theme.mutedText },
                    ]}
                  >
                    {sourceLabel}:{" "}
                    {
                      EXPEDITION_REGIONS[
                        Math.min(
                          gearItem.sourceZoneIndex,
                          EXPEDITION_REGIONS.length - 1,
                        )
                      ].name
                    }
                  </Text>
                  <Text
                    style={[
                      styles.gearInventoryMeta,
                      { color: theme.mutedText },
                    ]}
                  >
                    ATK +{gearItem.bonusStats.attack} • DEF +
                    {gearItem.bonusStats.defense}
                  </Text>
                  <Text
                    style={[
                      styles.gearInventoryMeta,
                      { color: theme.mutedText },
                    ]}
                  >
                    SPD +{gearItem.bonusStats.speed} • LCK +
                    {gearItem.bonusStats.luck}
                  </Text>
                  <Text
                    style={[
                      styles.gearInventoryMeta,
                      { color: theme.mutedText },
                    ]}
                  >
                    {equippedPet
                      ? `${equippedLabel}: ${equippedPet.name}`
                      : copy.petsExplorationUnknown}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedGear && (
            <View
              style={[
                styles.gearInventoryDetail,
                { backgroundColor: theme.surfaceMuted },
              ]}
            >
              <Text
                style={[styles.gearInventoryDetailName, { color: theme.text }]}
              >
                {selectedGear.name}
              </Text>
              <Text
                style={[
                  styles.gearInventoryDetailText,
                  { color: theme.mutedText },
                ]}
              >
                {getGearFlavorText(selectedGear)}
              </Text>
              <Text
                style={[
                  styles.gearInventoryDetailText,
                  { color: theme.mutedText },
                ]}
              >
                {sourceLabel}:{" "}
                {
                  EXPEDITION_REGIONS[
                    Math.min(
                      selectedGear.sourceZoneIndex,
                      EXPEDITION_REGIONS.length - 1,
                    )
                  ].name
                }
              </Text>
              <Text
                style={[
                  styles.gearInventoryDetailText,
                  { color: theme.mutedText },
                ]}
              >
                {bonusLabel}: ATK +{selectedGear.bonusStats.attack} • DEF +
                {selectedGear.bonusStats.defense} • SPD +
                {selectedGear.bonusStats.speed} • LCK +
                {selectedGear.bonusStats.luck}
              </Text>
              <TouchableOpacity
                style={[
                  styles.gearInventoryButton,
                  { backgroundColor: theme.accent },
                  selectedGear.equippedPetId === activePetId && {
                    backgroundColor: theme.border,
                  },
                ]}
                onPress={() => onEquipGear(selectedGear.id, activePetId)}
                disabled={selectedGear.equippedPetId === activePetId}
              >
                <Text
                  style={[
                    styles.gearInventoryButtonText,
                    {
                      color:
                        selectedGear.equippedPetId === activePetId
                          ? theme.mutedText
                          : theme.accentText,
                    },
                  ]}
                >
                  {selectedGear.equippedPetId === activePetId
                    ? equippedLabel
                    : equipLabel}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function MapLine({
  x1,
  y1,
  x2,
  y2,
  color,
  thickness = 4,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  thickness?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.mapLine,
        {
          left: x1,
          top: y1,
          width: length,
          height: thickness,
          backgroundColor: color,
          transform: [{ rotate: `${angle}rad` }],
        },
      ]}
    />
  );
}

interface MapNodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getMapConnectorLine(from: MapNodeRect, to: MapNodeRect) {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const safeDistance = Math.max(distance, 1);
  const unitX = dx / safeDistance;
  const unitY = dy / safeDistance;
  const x1 = fromCenterX + unitX * (from.width / 2);
  const y1 = fromCenterY + unitY * (from.height / 2);
  const x2 = toCenterX - unitX * (to.width / 2);
  const y2 = toCenterY - unitY * (to.height / 2);

  return {
    x1,
    y1,
    x2,
    y2,
  };
}

function MapExplorerModal({
  visible,
  gameState,
  settings,
  onClose,
  onFightZone,
  onExploreNode,
  onSendPetOnExpedition,
}: {
  visible: boolean;
  gameState: GameState;
  settings: AppSettings;
  onClose: () => void;
  onFightZone: (
    zoneIndex: number,
    petId: string,
    battleConsumableIds: string[],
  ) => void;
  onExploreNode: (nodeId: string, petId: string) => void;
  onSendPetOnExpedition: (petId: string) => void;
}) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const expeditionProgress = gameState.expeditionProgress;
  const revealedRegions = getExpeditionMapRegionCount(expeditionProgress);
  const activeExpedition = expeditionProgress.activeZoneIndex >= 0;
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedMode, setSelectedMode] = useState<"explore" | "combat">(
    "explore",
  );
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedBattleConsumableIds, setSelectedBattleConsumableIds] =
    useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const mapTranslateX = useSharedValue(0);
  const mapTranslateY = useSharedValue(0);
  const mapTranslateStartX = useSharedValue(0);
  const mapTranslateStartY = useSharedValue(0);
  const mapScale = useSharedValue(1);
  const mapScaleStart = useSharedValue(1);
  const mapSheetTranslateY = useSharedValue(0);
  const mapSheetStartY = useSharedValue(0);
  const mapDetailCollapseDistance = 316;

  const formatDuration = (durationMs: number) => {
    const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    setSelectedZoneIndex(Math.min(revealedRegions, EXPEDITION_MAP_REGIONS - 1));
    setSelectedNodeId("");
    setSelectedMode("explore");
    setSelectedBattleConsumableIds([]);
    setNow(Date.now());
    mapTranslateX.value = 0;
    mapTranslateY.value = 0;
    mapTranslateStartX.value = 0;
    mapTranslateStartY.value = 0;
    mapScale.value = 1;
    mapScaleStart.value = 1;
    mapSheetTranslateY.value = 0;
    mapSheetStartY.value = 0;
  }, [
    mapScale,
    mapSheetTranslateY,
    mapTranslateX,
    mapTranslateY,
    mapScaleStart,
    mapSheetStartY,
    mapTranslateStartX,
    mapTranslateStartY,
    revealedRegions,
    visible,
  ]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const selectedZone =
    EXPEDITION_REGIONS[
      Math.min(selectedZoneIndex, EXPEDITION_REGIONS.length - 1)
    ];
  const visibleZoneLimit = Math.min(
    revealedRegions + 1,
    EXPEDITION_MAP_REGIONS,
  );
  const visibleRegions = EXPEDITION_REGIONS.slice(0, visibleZoneLimit);

  const handleMapTap = (tapX: number, tapY: number) => {
    for (let i = 0; i < visibleRegions.length; i += 1) {
      const region = visibleRegions[i];
      if (
        tapX >= region.mapX &&
        tapX <= region.mapX + 128 &&
        tapY >= region.mapY &&
        tapY <= region.mapY + 114
      ) {
        setZoneSelection(i);
        return;
      }
    }

    for (let i = 0; i < visibleRegions.length; i += 1) {
      if (i >= revealedRegions) {
        continue;
      }

      const region = visibleRegions[i];
      for (const node of region.sideNodes) {
        if (
          tapX >= node.mapX &&
          tapX <= node.mapX + 100 &&
          tapY >= node.mapY &&
          tapY <= node.mapY + 84
        ) {
          setNodeSelection(node.id);
          return;
        }
      }
    }
  };

  const mapCanvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: mapTranslateX.value },
      { translateY: mapTranslateY.value },
      { scale: mapScale.value },
    ],
  }));

  const mapDetailSheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mapSheetTranslateY.value }],
  }));

  const mapPanGesture = Gesture.Pan()
    .minDistance(5)
    .maxPointers(1)
    .shouldCancelWhenOutside(false)
    .onBegin(() => {
      mapTranslateStartX.value = mapTranslateX.value;
      mapTranslateStartY.value = mapTranslateY.value;
    })
    .onUpdate((event) => {
      mapTranslateX.value = Math.max(
        -MAP_CANVAS_WIDTH,
        Math.min(MAP_CANVAS_WIDTH, mapTranslateStartX.value + event.translationX),
      );
      mapTranslateY.value = Math.max(
        -MAP_CANVAS_HEIGHT,
        Math.min(MAP_CANVAS_HEIGHT, mapTranslateStartY.value + event.translationY),
      );
    });

  const mapPinchGesture = Gesture.Pinch()
    .onBegin(() => {
      mapScaleStart.value = mapScale.value;
    })
    .onUpdate((event) => {
      const nextScale = Math.max(
        0.7,
        Math.min(1.45, mapScaleStart.value * event.scale),
      );
      mapScale.value = nextScale;
    });

  const mapTapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((event, success) => {
      if (!success) {
        return;
      }

      const contentTapX = (event.x - mapTranslateX.value) / mapScale.value;
      const contentTapY = (event.y - mapTranslateY.value) / mapScale.value;
      runOnJS(handleMapTap)(contentTapX, contentTapY);
    });

  const mapGesture = Gesture.Race(
    Gesture.Simultaneous(mapPanGesture, mapPinchGesture),
    mapTapGesture,
  );

  const mapSheetGesture = Gesture.Pan()
    .minDistance(5)
    .onBegin(() => {
      mapSheetStartY.value = mapSheetTranslateY.value;
    })
    .onUpdate((event) => {
      const nextValue = mapSheetStartY.value + event.translationY;
      mapSheetTranslateY.value = Math.max(
        0,
        Math.min(mapDetailCollapseDistance, nextValue),
      );
    })
    .onEnd(() => {
      const snappedValue =
        mapSheetTranslateY.value > mapDetailCollapseDistance / 2
          ? mapDetailCollapseDistance
          : 0;
      mapSheetTranslateY.value = snappedValue;
      mapSheetStartY.value = snappedValue;
    });

  if (!visible) {
    return null;
  }

  const selectedNode =
    selectedNodeId !== "" ? getExpeditionSideNodeById(selectedNodeId) : null;
  const selectedElement = selectedNode
    ? selectedNode.requiredElement
    : selectedZone.requiredElement;
  const allowedPets = gameState.pets.filter(
    (pet) =>
      selectedElement === "" ||
      getPetElement(pet.templateId) === selectedElement,
  );
  const selectedPet = gameState.pets.filter(
    (pet) => pet.id === selectedPetId,
  )[0];
  const availablePetId =
    selectedPet &&
    (selectedElement === "" ||
      getPetElement(selectedPet.templateId) === selectedElement)
      ? selectedPet.id
      : allowedPets[0]
        ? allowedPets[0].id
        : gameState.equippedPetId;
  const availablePet = gameState.pets.filter(
    (pet) => pet.id === availablePetId,
  )[0];
  const selectedBattleEncounter = getExpeditionBattlePreview(
    selectedNode ? selectedNode.zoneIndex : selectedZoneIndex,
  );
  const selectedBattleOutcome = availablePet
    ? previewExpeditionBattleOutcome(
        gameState,
        selectedNode ? selectedNode.zoneIndex : selectedZoneIndex,
        availablePet.id,
        selectedBattleConsumableIds,
      )
    : undefined;
  const zoneUnlocked = selectedZoneIndex < revealedRegions;
  const nextZoneReady =
    selectedZoneIndex === revealedRegions && !activeExpedition;
  const nodeCompleted = selectedNode
    ? isExpeditionNodeCompleted(gameState, selectedNode.id)
    : false;
  const fightAvailable = selectedNode ? nodeCompleted : zoneUnlocked;
  const nodeLocked = selectedNode !== null && allowedPets.length === 0;
  const selectedElementLabel =
    selectedElement === "" ? "Any pet" : selectedElement;
  const selectedDuration = selectedNode
    ? availablePet
      ? getExpeditionNodeDurationMs(selectedNode.id, availablePet.id, gameState)
      : 0
    : availablePet
      ? getExpeditionDurationMs(
          selectedZoneIndex,
          availablePet.explorationPower,
        )
      : 0;
  const selectedRemaining =
    selectedNode && expeditionProgress.activeNodeId === selectedNode.id
      ? Math.max(0, expeditionProgress.activeNodeEndsAt - now)
      : selectedZoneIndex === expeditionProgress.activeZoneIndex &&
          activeExpedition
        ? Math.max(0, expeditionProgress.activeZoneEndsAt - now)
        : selectedDuration;

  const setZoneSelection = (zoneIndex: number) => {
    setSelectedZoneIndex(zoneIndex);
    setSelectedNodeId("");
    setSelectedMode("explore");
    setSelectedBattleConsumableIds([]);
    setSelectedPetId("");
  };

  const setNodeSelection = (nodeId: string) => {
    const node = getExpeditionSideNodeById(nodeId);
    setSelectedZoneIndex(node.zoneIndex);
    setSelectedNodeId(nodeId);
    setSelectedMode("explore");
    setSelectedBattleConsumableIds([]);
    setSelectedPetId("");
  };

  const handlePetPick = (petId: string) => {
    setSelectedPetId(petId);
  };

  const handleExplore = () => {
    if (!availablePet) {
      return;
    }

    if (selectedNode) {
      onClose();
      onExploreNode(selectedNode.id, availablePet.id);
      return;
    }

    if (!nextZoneReady) {
      return;
    }

    onClose();
    onSendPetOnExpedition(availablePet.id);
  };

  const handleCombat = () => {
    if (!availablePet || !fightAvailable) {
      return;
    }

    onClose();
    onFightZone(
      selectedNode ? selectedNode.zoneIndex : selectedZoneIndex,
      availablePet.id,
      selectedBattleConsumableIds,
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.backdrop}>
        <View
          style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.82)" }]}
        >
          <SafeAreaView style={styles.safeArea}>
            <View
              style={[
                styles.mapModalShell,
                { backgroundColor: theme.background },
              ]}
            >
            <View
              style={[
                styles.mapModalHeader,
                {
                  borderBottomColor: theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <View>
                <Text style={[styles.mapModalTitle, { color: theme.text }]}>
                  World map
                </Text>
                <Text
                  style={[styles.mapModalSubtitle, { color: theme.mutedText }]}
                >
                  Drag around the map and tap a zone or branch to select it.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.mapCloseButton,
                  { backgroundColor: theme.surfaceMuted },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[styles.mapCloseButtonText, { color: theme.text }]}
                >
                  {copy.petsDetailClose}
                </Text>
              </TouchableOpacity>
            </View>

            <GestureDetector gesture={mapGesture}>
              <View
                style={[
                  styles.mapViewport,
                  { backgroundColor: theme.background },
                ]}
              >
                <Animated.View
                  style={[styles.mapCanvas, mapCanvasAnimatedStyle]}
                >
                  <View style={styles.mapBackdropGlow} />
                  {visibleRegions.map((region, index) => {
                    if (index > 0) {
                      const previous = visibleRegions[index - 1];
                      const line = getMapConnectorLine(
                        {
                          x: previous.mapX,
                          y: previous.mapY,
                          width: 128,
                          height: 114,
                        },
                        {
                          x: region.mapX,
                          y: region.mapY,
                          width: 128,
                          height: 114,
                        },
                      );

                      return (
                        <React.Fragment key={`zone-link-${region.name}`}>
                          <MapLine
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            color={
                              index < revealedRegions
                                ? theme.accentSoft
                                : theme.border
                            }
                            thickness={5}
                          />
                        </React.Fragment>
                      );
                    }

                    return null;
                  })}

                  {visibleRegions.map((region, index) => {
                    const revealed = index < revealedRegions;
                    const selected =
                      selectedNodeId === "" && selectedZoneIndex === index;

                    return (
                      <View
                        key={region.name}
                        pointerEvents="none"
                        style={[
                          styles.mapZoneNode,
                          {
                            left: region.mapX,
                            top: region.mapY,
                            backgroundColor: revealed
                              ? region.color
                              : theme.surfaceMuted,
                            borderColor: selected
                              ? theme.accent
                              : revealed
                                ? region.borderColor
                                : theme.border,
                            opacity:
                              revealed || selected || index === revealedRegions
                                ? 1
                                : 0.42,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.mapNodeIndex,
                            {
                              color: revealed
                                ? theme.accentText
                                : theme.mutedText,
                            },
                          ]}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </Text>
                        <Text
                          style={[
                            styles.mapNodeName,
                            { color: revealed ? theme.accentText : theme.text },
                          ]}
                        >
                          {revealed ? region.name : copy.petsExplorationUnknown}
                        </Text>
                        <Text
                          style={[
                            styles.mapNodeHint,
                            {
                              color: revealed
                                ? theme.accentText
                                : theme.mutedText,
                            },
                          ]}
                        >
                          {revealed ? region.hint : copy.petsExplorationFog}
                        </Text>
                      </View>
                    );
                  })}

                  {visibleRegions.map((region, index) => {
                    if (index >= revealedRegions) {
                      return null;
                    }

                    return region.sideNodes.map((node) => {
                      const explored = isExpeditionNodeCompleted(
                        gameState,
                        node.id,
                      );
                      const selected = selectedNodeId === node.id;
                      const line = getMapConnectorLine(
                        {
                          x: region.mapX,
                          y: region.mapY,
                          width: 128,
                          height: 114,
                        },
                        {
                          x: node.mapX,
                          y: node.mapY,
                          width: 100,
                          height: 84,
                        },
                      );

                      return (
                        <React.Fragment key={node.id}>
                          <MapLine
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            color={explored ? theme.accent : theme.border}
                            thickness={3}
                          />
                          <View
                            pointerEvents="none"
                            style={[
                              styles.mapBranchNode,
                              {
                                left: node.mapX,
                                top: node.mapY,
                                backgroundColor: explored
                                  ? theme.accentSoft
                                  : theme.surfaceMuted,
                                borderColor: selected
                                  ? theme.accent
                                  : explored
                                    ? theme.accent
                                    : theme.border,
                                opacity: explored ? 1 : 0.86,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.mapBranchType,
                                {
                                  color: explored
                                    ? theme.accent
                                    : theme.mutedText,
                                },
                              ]}
                            >
                              {node.type}
                            </Text>
                            <Text
                              style={[
                                styles.mapBranchName,
                                { color: theme.text },
                              ]}
                            >
                              {node.name}
                            </Text>
                            <Text
                              style={[
                                styles.mapBranchMeta,
                                { color: theme.mutedText },
                              ]}
                            >
                              {node.rewardLabel} +{node.rewardPower}
                            </Text>
                          </View>
                        </React.Fragment>
                      );
                    });
                  })}
                </Animated.View>
              </View>
            </GestureDetector>

            <Animated.View
              style={[
                styles.mapDetailSheet,
                {
                  backgroundColor: theme.surface,
                  borderTopColor: theme.border,
                },
                mapDetailSheetAnimatedStyle,
              ]}
            >
              <GestureDetector gesture={mapSheetGesture}>
                <View
                  style={[
                    styles.mapSheetHandle,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <View
                    style={[
                      styles.mapSheetHandleBar,
                      { backgroundColor: theme.border },
                    ]}
                  />
                  <View style={styles.mapDetailHeaderRow}>
                    <View style={styles.mapDetailTitleStack}>
                      <Text
                        style={[styles.mapDetailTitle, { color: theme.text }]}
                      >
                        {selectedNode ? selectedNode.name : selectedZone.name}
                      </Text>
                      <Text
                        style={[
                          styles.mapDetailSubtitle,
                          { color: theme.mutedText },
                        ]}
                      >
                        {selectedNode
                          ? selectedNode.description
                          : selectedZone.hint}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.mapDetailTag,
                        { backgroundColor: theme.surfaceMuted },
                      ]}
                    >
                      <Text
                        style={[styles.mapDetailTagText, { color: theme.text }]}
                      >
                        {selectedNode ? selectedNode.type : "zone"}
                      </Text>
                    </View>
                  </View>
                </View>
              </GestureDetector>

              <ScrollView
                style={styles.mapDetailScroll}
                contentContainerStyle={styles.mapDetailScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.mapModeRow}>
                  <TouchableOpacity
                    style={[
                      styles.mapModeButton,
                      {
                        backgroundColor:
                          selectedMode === "explore"
                            ? theme.accent
                            : theme.surfaceMuted,
                      },
                    ]}
                    onPress={() => setSelectedMode("explore")}
                  >
                    <Text
                      style={[
                        styles.mapModeButtonText,
                        {
                          color:
                            selectedMode === "explore"
                              ? theme.accentText
                              : theme.mutedText,
                        },
                      ]}
                    >
                      Explore
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.mapModeButton,
                      {
                        backgroundColor:
                          selectedMode === "combat"
                            ? theme.hero
                            : theme.surfaceMuted,
                      },
                      !fightAvailable && { backgroundColor: theme.border },
                    ]}
                    onPress={() => setSelectedMode("combat")}
                    disabled={!fightAvailable}
                  >
                    <Text
                      style={[
                        styles.mapModeButtonText,
                        {
                          color:
                            selectedMode === "combat"
                              ? theme.heroText
                              : theme.mutedText,
                        },
                      ]}
                    >
                      Combat
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.mapMetaRow}>
                  <View
                    style={[
                      styles.mapMetaCard,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={[styles.mapMetaLabel, { color: theme.mutedText }]}
                    >
                      Required pet
                    </Text>
                    <Text style={[styles.mapMetaValue, { color: theme.text }]}>
                      {selectedElementLabel}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.mapMetaCard,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={[styles.mapMetaLabel, { color: theme.mutedText }]}
                    >
                      Timer
                    </Text>
                    <Text style={[styles.mapMetaValue, { color: theme.text }]}>
                      {formatDuration(selectedRemaining)}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.mapDetailHint, { color: theme.mutedText }]}
                >
                  {selectedNode
                    ? nodeCompleted
                      ? "This branch was already explored."
                      : nodeLocked
                        ? `Only ${selectedElement} pets can explore this branch.`
                        : !fightAvailable
                          ? "Explore this branch before fighting here."
                          : selectedMode === "explore"
                            ? "Pick a matching pet to start the branch timer."
                            : "Pick a pet and consumables for combat."
                    : zoneUnlocked
                      ? "This zone is already revealed. You can still fight here."
                      : nextZoneReady
                        ? selectedElement === ""
                          ? "Any pet can explore this zone next."
                          : `Only ${selectedElement} pets can explore this zone next.`
                        : "This zone is locked behind earlier map progress."}
                </Text>

                <View style={styles.mapPetGrid}>
                  {allowedPets.length === 0 ? (
                    <Text
                      style={[styles.emptyText, { color: theme.mutedText }]}
                    >
                      No pets match this requirement yet.
                    </Text>
                  ) : (
                    allowedPets.map((pet) => (
                      <TouchableOpacity
                        key={pet.id}
                        style={[
                          styles.mapPetChip,
                          {
                            backgroundColor:
                              selectedPetId === pet.id ||
                              (selectedPetId === "" &&
                                pet.id === availablePetId)
                                ? theme.accent
                                : theme.surfaceMuted,
                            borderColor:
                              selectedPetId === pet.id ||
                              (selectedPetId === "" &&
                                pet.id === availablePetId)
                                ? theme.accentSoft
                                : theme.border,
                          },
                        ]}
                        onPress={() => handlePetPick(pet.id)}
                      >
                        <Text
                          style={[
                            styles.mapPetChipText,
                            {
                              color:
                                selectedPetId === pet.id ||
                                (selectedPetId === "" &&
                                  pet.id === availablePetId)
                                  ? theme.accentText
                                  : theme.text,
                            },
                          ]}
                        >
                          {pet.name}
                        </Text>
                        <Text
                          style={[
                            styles.mapPetChipMeta,
                            {
                              color:
                                selectedPetId === pet.id ||
                                (selectedPetId === "" &&
                                  pet.id === availablePetId)
                                  ? theme.accentText
                                  : theme.mutedText,
                            },
                          ]}
                        >
                          {pet.explorationPower} power
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                {selectedMode === "combat" && (
                  <View
                    style={[
                      styles.mapCombatCard,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={[styles.mapCombatTitle, { color: theme.text }]}
                    >
                      Combat preview
                    </Text>
                    <Text
                      style={[styles.mapCombatMeta, { color: theme.mutedText }]}
                    >
                      Enemy trait: {selectedBattleEncounter.enemyTrait} •{" "}
                      {selectedBattleEncounter.enemyTraitDescription}
                    </Text>
                    <Text
                      style={[styles.mapCombatMeta, { color: theme.mutedText }]}
                    >
                      Your power:{" "}
                      {selectedBattleOutcome
                        ? selectedBattleOutcome.playerPower
                        : 0}
                    </Text>
                    <Text
                      style={[styles.mapCombatMeta, { color: theme.mutedText }]}
                    >
                      Enemy power:{" "}
                      {selectedBattleOutcome
                        ? selectedBattleOutcome.enemyPower
                        : selectedBattleEncounter.wildPower}
                    </Text>
                    <View style={styles.battleConsumableGrid}>
                      {gameState.battleConsumables.map((item) => {
                        const selected = selectedBattleConsumableIds.includes(
                          item.id,
                        );

                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.battleConsumableCard,
                              {
                                backgroundColor: selected
                                  ? theme.accent
                                  : theme.surface,
                                borderColor: selected
                                  ? theme.accentSoft
                                  : theme.border,
                              },
                            ]}
                            onPress={() =>
                              setSelectedBattleConsumableIds((currentIds) =>
                                selected
                                  ? currentIds.filter(
                                      (currentId) => currentId !== item.id,
                                    )
                                  : currentIds.length >= 3
                                    ? currentIds
                                    : [...currentIds, item.id],
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.battleConsumableName,
                                {
                                  color: selected
                                    ? theme.accentText
                                    : theme.text,
                                },
                              ]}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[
                                styles.battleConsumableMeta,
                                {
                                  color: selected
                                    ? theme.accentText
                                    : theme.mutedText,
                                },
                              ]}
                            >
                              {getBattleConsumableKindLabel(item.kind)} •{" "}
                              {item.rarity}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View style={styles.mapActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.mapActionButton,
                      { backgroundColor: theme.hero },
                      selectedMode === "explore" &&
                        allowedPets.length === 0 && {
                          backgroundColor: theme.border,
                        },
                      selectedMode === "explore" &&
                        selectedNode &&
                        nodeLocked && { backgroundColor: theme.border },
                      selectedMode === "explore" &&
                        !selectedNode &&
                        !nextZoneReady && { backgroundColor: theme.border },
                    ]}
                    onPress={handleExplore}
                    disabled={
                      allowedPets.length === 0 ||
                      (selectedNode
                        ? nodeLocked || nodeCompleted || activeExpedition
                        : !nextZoneReady)
                    }
                  >
                    <Text
                      style={[
                        styles.mapActionButtonText,
                        {
                          color:
                            allowedPets.length > 0
                              ? theme.heroText
                              : theme.mutedText,
                        },
                      ]}
                    >
                      {selectedNode ? "Explore branch" : "Explore zone"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.mapActionButton,
                      { backgroundColor: theme.warning },
                      (!availablePet || !fightAvailable) && {
                        backgroundColor: theme.border,
                      },
                    ]}
                    onPress={handleCombat}
                    disabled={!availablePet || !fightAvailable}
                  >
                    <Text
                      style={[
                        styles.mapActionButtonText,
                        {
                          color:
                            availablePet && fightAvailable
                              ? theme.heroText
                              : theme.mutedText,
                        },
                      ]}
                    >
                      Fight here
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
            </View>
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function PetDetailModal({
  visible,
  gameState,
  settings,
  petId,
  canBattle,
  battleZoneIndex,
  activeExpedition,
  onClose,
  onEquipPet,
  onEquipGear,
  onFightZone,
  onFusePet,
  onSellPet,
  onSendPetOnExpedition,
}: {
  visible: boolean;
  gameState: GameState;
  settings: AppSettings;
  petId: string;
  canBattle: boolean;
  battleZoneIndex: number;
  activeExpedition: boolean;
  onClose: () => void;
  onEquipPet: (petId: string) => void;
  onEquipGear: (gearItemId: string, petId: string) => void;
  onFightZone: (
    zoneIndex: number,
    petId: string,
    battleConsumableIds: string[],
  ) => void;
  onFusePet: (targetPetId: string, sourcePetId: string) => void;
  onSellPet: (petId: string) => void;
  onSendPetOnExpedition: (petId: string) => void;
}) {
  if (!visible) {
    return null;
  }

  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const pet = gameState.pets.filter((currentPet) => currentPet.id === petId)[0];
  if (!pet) {
    return null;
  }
  const petTemplate = getPetTemplates().filter(
    (template) => template.id === pet.templateId,
  )[0];
  const petXpProgress = getLevelProgress(pet.experience, PET_LEVEL_BASE_COST);
  const attachedGear = gameState.gearItems.filter(
    (gearItem) => gearItem.equippedPetId === pet.id,
  );
  const currentGear = attachedGear[0];
  const gearBonus = attachedGear.reduce(
    (bonus, gearItem) => ({
      attack: bonus.attack + gearItem.bonusStats.attack,
      defense: bonus.defense + gearItem.bonusStats.defense,
      speed: bonus.speed + gearItem.bonusStats.speed,
      luck: bonus.luck + gearItem.bonusStats.luck,
    }),
    {
      attack: 0,
      defense: 0,
      speed: 0,
      luck: 0,
    },
  );
  const fuseSourcePets = getFuseSourcePets(gameState, petId);
  const firstFuseCopy =
    pet.fusionLevel < MAX_PET_FUSIONS ? fuseSourcePets[0] : undefined;
  const sellablePet = getSellablePets(gameState).filter(
    (currentPet) => currentPet.id === pet.id,
  )[0];
  const battleEncounter = getExpeditionBattlePreview(battleZoneIndex);
  const elementLabel =
    petTemplate.element.charAt(0).toUpperCase() + petTemplate.element.slice(1);
  const evolutionLabel =
    pet.evolutionStage === 2
      ? copy.petsEvolutionAscended
      : pet.evolutionStage === 1
        ? copy.petsEvolutionEvolved
        : copy.petsEvolutionBase;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.detailModal, { backgroundColor: theme.background }]}
      >
        <View
          style={[
            styles.detailHeader,
            {
              backgroundColor: theme.surface,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View>
            <Text style={[styles.detailTitle, { color: theme.text }]}>
              {copy.petsDetailTitle}
            </Text>
            <Text style={[styles.detailSubtitle, { color: theme.mutedText }]}>
              {pet.name}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.detailCloseButton,
              { backgroundColor: theme.surfaceMuted },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.detailCloseText, { color: theme.text }]}>
              {copy.petsDetailClose}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailScrollContent}
        >
          <View style={[styles.detailHero, { backgroundColor: theme.surface }]}>
            <Image
              source={getPetImage(
                pet.templateId,
                pet.evolutionStage,
                pet.activeImageVariantId,
              )}
              style={styles.detailHeroImage}
              resizeMode="contain"
            />
            <View style={styles.detailHeroBody}>
              <View style={styles.detailBadgeRow}>
                <View
                  style={[
                    styles.detailBadge,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Text
                    style={[styles.detailBadgeText, { color: theme.accent }]}
                  >
                    {pet.rarity}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailBadge,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[styles.detailBadgeText, { color: theme.mutedText }]}
                  >
                    {elementLabel}
                  </Text>
                </View>
                {pet.equipped && (
                  <View
                    style={[
                      styles.detailBadge,
                      { backgroundColor: theme.hero },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailBadgeText,
                        { color: theme.heroText },
                      ]}
                    >
                      {copy.petsActive}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.detailPetName, { color: theme.text }]}>
                {pet.name}
              </Text>
              <Text
                style={[
                  styles.detailPetDescription,
                  { color: theme.mutedText },
                ]}
              >
                {petTemplate.description}
              </Text>

              <View style={styles.detailQuickStats}>
                <View
                  style={[
                    styles.detailQuickStatCard,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailQuickStatLabel,
                      { color: theme.mutedText },
                    ]}
                  >
                    {copy.petsLevel}
                  </Text>
                  <Text
                    style={[styles.detailQuickStatValue, { color: theme.text }]}
                  >
                    {pet.level}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailQuickStatCard,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailQuickStatLabel,
                      { color: theme.mutedText },
                    ]}
                  >
                    {copy.petsExperience}
                  </Text>
                  <Text
                    style={[styles.detailQuickStatValue, { color: theme.text }]}
                  >
                    {pet.experience}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailQuickStatCard,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailQuickStatLabel,
                      { color: theme.mutedText },
                    ]}
                  >
                    {copy.petsCombatPower}
                  </Text>
                  <Text
                    style={[styles.detailQuickStatValue, { color: theme.text }]}
                  >
                    {pet.combatPower}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailQuickStatCard,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailQuickStatLabel,
                      { color: theme.mutedText },
                    ]}
                  >
                    {copy.petsExplorationPower}
                  </Text>
                  <Text
                    style={[styles.detailQuickStatValue, { color: theme.text }]}
                  >
                    {pet.explorationPower}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.detailXpTrack,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <View
                  style={[
                    styles.detailXpFill,
                    {
                      width: `${Math.round(petXpProgress * 100)}%`,
                      backgroundColor: theme.accent,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View
            style={[styles.detailSection, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
              {copy.petsDetailOverview}
            </Text>
            <View style={styles.detailStatList}>
              <View
                style={[
                  styles.detailStatRow,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.detailStatLabel, { color: theme.mutedText }]}
                >
                  {copy.petsDetailElement}
                </Text>
                <Text style={[styles.detailStatValue, { color: theme.text }]}>
                  {elementLabel}
                </Text>
              </View>
              <View
                style={[
                  styles.detailStatRow,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.detailStatLabel, { color: theme.mutedText }]}
                >
                  {copy.petsEvolution}
                </Text>
                <Text style={[styles.detailStatValue, { color: theme.text }]}>
                  {evolutionLabel}
                </Text>
              </View>
              <View
                style={[
                  styles.detailStatRow,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.detailStatLabel, { color: theme.mutedText }]}
                >
                  {copy.petsTaskBonus}
                </Text>
                <Text style={[styles.detailStatValue, { color: theme.text }]}>
                  +{(pet.taskMultiplier * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            <Text style={[styles.detailText, { color: theme.mutedText }]}>
              {copy.petsDetailDescription}: {petTemplate.description}
            </Text>
          </View>

          <View
            style={[styles.detailSection, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
              {copy.petsDetailStatsTitle}
            </Text>
            <View style={styles.detailStatList}>
              <View
                style={[
                  styles.detailStatRow,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.detailStatLabel, { color: theme.mutedText }]}
                >
                  Base
                </Text>
                <Text style={[styles.detailStatValue, { color: theme.text }]}>
                  ATK {pet.baseStats.attack} • DEF {pet.baseStats.defense} • SPD{" "}
                  {pet.baseStats.speed} • LCK {pet.baseStats.luck}
                </Text>
              </View>
              <View
                style={[
                  styles.detailStatRow,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.detailStatLabel, { color: theme.mutedText }]}
                >
                  Gear
                </Text>
                <Text style={[styles.detailStatValue, { color: theme.text }]}>
                  ATK +{gearBonus.attack} • DEF +{gearBonus.defense} • SPD +
                  {gearBonus.speed} • LCK +{gearBonus.luck}
                </Text>
              </View>
              <View
                style={[
                  styles.detailStatRow,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.detailStatLabel, { color: theme.mutedText }]}
                >
                  Final
                </Text>
                <Text style={[styles.detailStatValue, { color: theme.text }]}>
                  ATK {pet.stats.attack} • DEF {pet.stats.defense} • SPD{" "}
                  {pet.stats.speed} • LCK {pet.stats.luck}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[styles.detailSection, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
              {copy.petsDetailCurrentGear}
            </Text>
            {currentGear ? (
              <View
                style={[
                  styles.detailGearCard,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.detailGearBody}>
                  <Text style={[styles.detailGearName, { color: theme.text }]}>
                    {currentGear.name}
                  </Text>
                  <Text
                    style={[styles.detailGearMeta, { color: theme.mutedText }]}
                  >
                    {copy.petsGearLabel} • {currentGear.rarity}
                  </Text>
                  <Text
                    style={[styles.detailGearMeta, { color: theme.mutedText }]}
                  >
                    {getGearFlavorText(currentGear)}
                  </Text>
                  <Text
                    style={[styles.detailGearMeta, { color: theme.mutedText }]}
                  >
                    {copy.petsDetailSource}:{" "}
                    {
                      EXPEDITION_REGIONS[
                        Math.min(
                          currentGear.sourceZoneIndex,
                          EXPEDITION_REGIONS.length - 1,
                        )
                      ].name
                    }
                  </Text>
                  <Text
                    style={[styles.detailGearMeta, { color: theme.mutedText }]}
                  >
                    {copy.petsGearBonus}: ATK +{currentGear.bonusStats.attack} •
                    DEF +{currentGear.bonusStats.defense} • SPD +
                    {currentGear.bonusStats.speed} • LCK +
                    {currentGear.bonusStats.luck}
                  </Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.detailEmptyCard,
                  { backgroundColor: theme.surfaceMuted },
                ]}
              >
                <Text
                  style={[styles.detailEmptyText, { color: theme.mutedText }]}
                >
                  {copy.petsGearNoItems}
                </Text>
              </View>
            )}
          </View>

          <View
            style={[styles.detailSection, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
              {copy.petsDetailAvailableGear}
            </Text>
            <GearInventoryPanel
              gameState={gameState}
              settings={settings}
              gearItems={gameState.gearItems}
              activePetId={pet.id}
              onEquipGear={onEquipGear}
              emptyText={copy.petsGearNoItems}
              sourceLabel={copy.petsDetailSource}
              gearLabel={copy.petsGearLabel}
              bonusLabel={copy.petsGearBonus}
              equipLabel={copy.petsGearEquip}
              equippedLabel={copy.petsGearEquipped}
              panelTitle=""
              panelSubtitle=""
            />
          </View>

          <View
            style={[styles.detailSection, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.detailSectionTitle, { color: theme.text }]}>
              {copy.petsDetailActions}
            </Text>
            <View style={styles.detailActionGrid}>
              <TouchableOpacity
                style={[
                  styles.detailActionButton,
                  { backgroundColor: theme.accent },
                  pet.equipped && { backgroundColor: theme.border },
                ]}
                onPress={() => onEquipPet(pet.id)}
                disabled={pet.equipped}
              >
                <Text
                  style={[
                    styles.detailActionButtonText,
                    {
                      color: pet.equipped ? theme.mutedText : theme.accentText,
                    },
                  ]}
                >
                  {pet.equipped ? copy.petsActive : copy.petsEquip}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.detailActionButton,
                  { backgroundColor: theme.hero },
                  activeExpedition && { backgroundColor: theme.border },
                ]}
                onPress={() => onSendPetOnExpedition(pet.id)}
                disabled={activeExpedition}
              >
                <Text
                  style={[
                    styles.detailActionButtonText,
                    {
                      color: activeExpedition
                        ? theme.mutedText
                        : theme.heroText,
                    },
                  ]}
                >
                  {copy.petsExplorationSend}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.detailActionButton,
                  { backgroundColor: theme.warning },
                  !canBattle && { backgroundColor: theme.border },
                ]}
                onPress={() => onFightZone(battleZoneIndex, pet.id, [])}
                disabled={!canBattle}
              >
                <Text
                  style={[
                    styles.detailActionButtonText,
                    {
                      color: !canBattle ? theme.mutedText : theme.heroText,
                    },
                  ]}
                >
                  {copy.petsBattleFight}
                </Text>
              </TouchableOpacity>
              {firstFuseCopy && (
                <TouchableOpacity
                  style={[
                    styles.detailActionButton,
                    { backgroundColor: theme.hero },
                  ]}
                  onPress={() => onFusePet(pet.id, firstFuseCopy.id)}
                >
                  <Text
                    style={[
                      styles.detailActionButtonText,
                      { color: theme.heroText },
                    ]}
                  >
                    {copy.petsFuseCopy}
                  </Text>
                </TouchableOpacity>
              )}
              {sellablePet && (
                <TouchableOpacity
                  style={[
                    styles.detailActionButton,
                    { backgroundColor: theme.danger },
                  ]}
                  onPress={() => onSellPet(pet.id)}
                >
                  <Text
                    style={[
                      styles.detailActionButtonText,
                      { color: theme.heroText },
                    ]}
                  >
                    {copy.petsSell}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.detailText, { color: theme.mutedText }]}>
              {copy.petsBattleWildPet}: {battleEncounter.wildPetName}
            </Text>
            <Text style={[styles.detailText, { color: theme.mutedText }]}>
              {copy.petsBattleWildPower}: {battleEncounter.wildPower}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function TabButton({
  label,
  active,
  highlighted,
  disabled,
  onPress,
  settings,
}: {
  label: string;
  active: boolean;
  highlighted: boolean;
  disabled: boolean;
  onPress: () => void;
  settings: AppSettings;
}) {
  const theme = getAppTheme(settings.theme);

  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        { backgroundColor: active ? theme.accent : theme.surfaceMuted },
        highlighted && styles.tutorialHighlight,
        disabled && styles.tutorialDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.tabButtonText,
          { color: active ? theme.accentText : theme.mutedText },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#eef2f1",
    alignItems: "center",
  },
  tutorialHighlight: {
    borderWidth: 2,
    borderColor: "#ffd166",
    shadowColor: "#ffd166",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 10,
  },
  tutorialDisabled: {
    opacity: 0.34,
  },
  tutorialTargetButton: {
    borderColor: "#ffd166",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  explorationStack: {
    gap: 12,
  },
  explorationHero: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
    elevation: 2,
  },
  mapOpenButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  mapOpenButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  explorationStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  explorationStatCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  explorationStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  explorationStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  activeExpeditionCard: {
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  activeExpeditionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  activeExpeditionValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  mapModalShell: {
    flex: 1,
    position: "relative",
  },
  backdrop: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  mapModalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  mapModalTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  mapModalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  mapCloseButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  mapCloseButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  mapViewport: {
    flex: 1,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  mapScrollContainer: {
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  mapCanvas: {
    width: MAP_CANVAS_WIDTH,
    height: MAP_CANVAS_HEIGHT,
    borderRadius: 28,
    backgroundColor: "#f8f4ea",
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  mapBackdropGlow: {
    position: "absolute",
    left: 120,
    top: 80,
    width: 900,
    height: 520,
    borderRadius: 999,
    backgroundColor: "rgba(120, 180, 255, 0.12)",
  },
  mapLine: {
    position: "absolute",
    height: 4,
    borderRadius: 999,
    opacity: 0.9,
  },
  mapZoneNode: {
    position: "absolute",
    width: 128,
    height: 114,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 4,
    elevation: 2,
  },
  mapNodeIndex: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  mapNodeName: {
    fontSize: 15,
    fontWeight: "800",
  },
  mapNodeHint: {
    fontSize: 11,
    lineHeight: 15,
  },
  mapBranchNode: {
    position: "absolute",
    width: 100,
    height: 84,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  mapBranchType: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  mapBranchName: {
    fontSize: 13,
    fontWeight: "800",
  },
  mapBranchMeta: {
    fontSize: 10,
    fontWeight: "600",
  },
  mapDetailSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 430,
    borderTopWidth: 1,
    elevation: 10,
    zIndex: 10,
  },
  mapSheetHandle: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  mapSheetHandleBar: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 999,
  },
  mapDetailScroll: {
    flex: 1,
  },
  mapDetailScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
    gap: 10,
  },
  mapDetailHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  mapDetailTitleStack: {
    flex: 1,
    gap: 4,
  },
  mapDetailTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  mapDetailSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  mapDetailTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mapDetailTagText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  mapModeRow: {
    flexDirection: "row",
    gap: 10,
  },
  mapModeButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  mapModeButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  mapMetaRow: {
    flexDirection: "row",
    gap: 10,
  },
  mapMetaCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  mapMetaLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  mapMetaValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  mapDetailHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  mapPetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mapPetChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: "31%",
    gap: 3,
  },
  mapPetChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  mapPetChipMeta: {
    fontSize: 10,
    fontWeight: "600",
  },
  mapCombatCard: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  mapCombatTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  mapCombatMeta: {
    fontSize: 11,
    lineHeight: 15,
  },
  mapActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  mapActionButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  mapActionButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  mapPanel: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  mapRoute: {
    gap: 12,
  },
  regionRow: {
    gap: 12,
  },
  regionRowOffset: {
    marginLeft: 18,
  },
  regionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
    minHeight: 110,
    justifyContent: "center",
  },
  regionIndex: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  regionName: {
    fontSize: 18,
    fontWeight: "800",
  },
  regionHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  regionBadge: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  regionNodeStack: {
    gap: 8,
    marginLeft: 18,
  },
  nodeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  nodeType: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: "800",
  },
  nodeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  nodeReward: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nodeLock: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  routeConnector: {
    width: 3,
    height: 18,
    borderRadius: 999,
    marginLeft: 18,
  },
  explorationRoster: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  expeditionList: {
    gap: 10,
  },
  emptyExpeditionCard: {
    borderRadius: 14,
    padding: 14,
  },
  battlePanel: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  battleLoadoutCard: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  battleLoadoutMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  battleConsumableGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  battleConsumableCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  battleConsumableName: {
    fontSize: 13,
    fontWeight: "800",
  },
  battleConsumableMeta: {
    fontSize: 11,
    lineHeight: 15,
  },
  battlePreviewCard: {
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  battlePreviewText: {
    fontSize: 12,
    lineHeight: 16,
  },
  battleZoneCard: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  battleZoneLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  battleZoneValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  battleSubhead: {
    fontSize: 13,
    fontWeight: "600",
  },
  battlePetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  battlePetChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  battlePetChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  battleButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  battleButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  gearVault: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  gearInventoryShell: {
    gap: 10,
  },
  gearInventoryHeader: {
    gap: 4,
  },
  gearInventoryTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  gearInventorySubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  gearInventorySummaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  gearInventorySummaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  gearInventorySummaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  gearInventorySummaryValue: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  gearInventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gearInventoryCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  gearInventoryCardHeader: {
    gap: 3,
  },
  gearInventoryName: {
    fontSize: 14,
    fontWeight: "800",
  },
  gearInventoryRarity: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  gearInventoryMeta: {
    fontSize: 11,
    lineHeight: 16,
  },
  gearInventoryDetail: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  gearInventoryDetailName: {
    fontSize: 16,
    fontWeight: "800",
  },
  gearInventoryDetailText: {
    fontSize: 12,
    lineHeight: 17,
  },
  gearInventoryButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  gearInventoryButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  expeditionPetCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expeditionPetImage: {
    width: 52,
    height: 52,
  },
  expeditionPetBody: {
    flex: 1,
    gap: 4,
  },
  expeditionPetName: {
    fontSize: 15,
    fontWeight: "800",
  },
  expeditionPetMeta: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  expeditionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  expeditionButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  shopCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  shopTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  shopText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  pityGrid: {
    gap: 10,
    marginTop: 10,
  },
  sellList: {
    gap: 10,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  pityCard: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  pityPetImage: {
    width: 48,
    height: 48,
    alignSelf: "center",
    marginBottom: 6,
  },
  pityCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pityName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  pityRarity: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "capitalize",
  },
  pityMeta: {
    fontSize: 12,
    color: "#555",
    marginBottom: 4,
  },
  redeemButton: {
    marginTop: 8,
    backgroundColor: "#f39c12",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  redeemButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  sellCard: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  sellMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textTransform: "capitalize",
  },
  sellButton: {
    backgroundColor: "#d35400",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sellButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  grid: {
    gap: 12,
  },
  petCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  petCardImage: {
    width: 96,
    height: 96,
    alignSelf: "center",
    marginBottom: 8,
  },
  petCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  petName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  petMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    textTransform: "capitalize",
  },
  equippedBadge: {
    backgroundColor: "#dff8f4",
    color: "#1f7a73",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  petStat: {
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
  },
  xpProgressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 10,
  },
  xpProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  petActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  powerRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  powerCard: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  powerLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  powerValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  actionButton: {
    backgroundColor: "#1f7a73",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  fuseButton: {
    backgroundColor: "#275dad",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  fuseButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  detailModal: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  detailSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  detailCloseButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  detailCloseText: {
    fontSize: 13,
    fontWeight: "700",
  },
  detailScroll: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 16,
    gap: 14,
  },
  detailHero: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  detailHeroImage: {
    width: 140,
    height: 140,
    alignSelf: "center",
  },
  detailHeroBody: {
    gap: 12,
  },
  detailBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  detailPetName: {
    fontSize: 26,
    fontWeight: "800",
  },
  detailPetDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailQuickStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  detailQuickStatCard: {
    flexBasis: "48%",
    borderRadius: 14,
    padding: 12,
  },
  detailQuickStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailQuickStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  detailXpTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  detailXpFill: {
    height: "100%",
    borderRadius: 999,
  },
  detailSection: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  detailStatList: {
    gap: 10,
  },
  detailStatRow: {
    borderRadius: 14,
    padding: 12,
  },
  detailStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailStatValue: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 19,
  },
  detailGearList: {
    gap: 10,
  },
  detailGearCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  detailGearBody: {
    gap: 6,
  },
  detailGearName: {
    fontSize: 16,
    fontWeight: "800",
  },
  detailGearMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  detailGearButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  detailGearButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  detailEmptyCard: {
    borderRadius: 14,
    padding: 14,
  },
  detailEmptyText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  detailActionGrid: {
    gap: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailActionButton: {
    minWidth: "48%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  detailActionButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  gachaRow: {
    flexDirection: "row",
    gap: 10,
  },
  gachaButton: {
    backgroundColor: "#4ecdc4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  gachaButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
