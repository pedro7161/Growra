import React, { useState } from "react";
import {
    Image,
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
import { AppSettings, GameState } from "../types";
import {
    getFuseSourcePets,
    getLevelProgress,
    getNextEvolutionFusionTarget,
    getPetTemplates,
    getPityCost,
    getSellablePets,
    getSellValue,
    MAX_PET_FUSIONS,
    MULTI_SUMMON_COST,
    PET_LEVEL_BASE_COST,
    SUMMON_COST,
} from "../utils/gameplay";

interface PetsScreenProps {
  gameState: GameState;
  settings: AppSettings;
  onEquipPet: (petId: string) => void;
  onFusePet: (targetPetId: string, sourcePetId: string) => void;
  onRedeemPityPet: (templateId: string) => void;
  onSellPet: (petId: string) => void;
  onSummonPet: () => void;
  onMultiSummonPet: () => void;
}

export default function PetsScreen({
  gameState,
  settings,
  onEquipPet,
  onFusePet,
  onRedeemPityPet,
  onSellPet,
  onSummonPet,
  onMultiSummonPet,
}: PetsScreenProps) {
  const copy = getAppCopy(settings.language);
  const theme = getAppTheme(settings.theme);
  const [activeTab, setActiveTab] = useState<
    "my-pets" | "exploration" | "summon"
  >("my-pets");
  const [myPetsSubTab, setMyPetsSubTab] = useState<"box" | "fuse">("box");
  const [summonSubTab, setSummonSubTab] = useState<
    "banner" | "pityshop" | "sell"
  >("banner");
  const petTemplates = getPetTemplates();
  const sellablePets = getSellablePets(gameState);

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
        />
        <TabButton
          label="Exploration"
          active={activeTab === "exploration"}
          onPress={() => setActiveTab("exploration")}
          settings={settings}
        />
        <TabButton
          label={copy.petsSummonTab}
          active={activeTab === "summon"}
          onPress={() => setActiveTab("summon")}
          settings={settings}
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
              />
              <TabButton
                label="Fuse"
                active={myPetsSubTab === "fuse"}
                onPress={() => setMyPetsSubTab("fuse")}
                settings={settings}
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
                    onEquipPet={onEquipPet}
                    onFusePet={() => {}}
                    hideFuseButton={true}
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
                    onEquipPet={onEquipPet}
                    onFusePet={onFusePet}
                    hideEquipButton={true}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === "exploration" && (
          <View style={[styles.shopCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.shopTitle, { color: theme.text }]}>
              Exploration
            </Text>
            <Text style={[styles.shopText, { color: theme.mutedText }]}>
              Coming soon... Send your pets to explore the realm!
            </Text>
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
              />
              <TabButton
                label="Pity Shop"
                active={summonSubTab === "pityshop"}
                onPress={() => setSummonSubTab("pityshop")}
                settings={settings}
              />
              <TabButton
                label="Sell"
                active={summonSubTab === "sell"}
                onPress={() => setSummonSubTab("sell")}
                settings={settings}
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
              ]}
              onPress={onSummonPet}
              disabled={gameState.coins < SUMMON_COST}
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
              ]}
              onPress={onMultiSummonPet}
              disabled={gameState.coins < MULTI_SUMMON_COST}
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
  onEquipPet,
  onFusePet,
  hideEquipButton = false,
  hideFuseButton = false,
}: {
  gameState: GameState;
  petId: string;
  settings: AppSettings;
  onEquipPet: (petId: string) => void;
  onFusePet: (targetPetId: string, sourcePetId: string) => void;
  hideEquipButton?: boolean;
  hideFuseButton?: boolean;
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

  return (
    <View style={[styles.petCard, { backgroundColor: theme.surface }]}>
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
            ]}
            onPress={() => onEquipPet(pet.id)}
            disabled={pet.equipped}
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
            ]}
            onPress={
              firstFuseCopy
                ? () => onFusePet(pet.id, firstFuseCopy.id)
                : undefined
            }
            disabled={!firstFuseCopy}
          >
            <Text style={styles.fuseButtonText}>{copy.petsFuseCopy}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
  settings,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  settings: AppSettings;
}) {
  const theme = getAppTheme(settings.theme);

  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        { backgroundColor: active ? theme.accent : theme.surfaceMuted },
      ]}
      onPress={onPress}
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
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
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
