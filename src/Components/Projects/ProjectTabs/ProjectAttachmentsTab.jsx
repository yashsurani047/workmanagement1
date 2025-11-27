import React from "react";
import { View, Text, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback, Image } from "react-native";
import { Paperclip, X } from "lucide-react-native";
import theme from "../../../Themes/Themes";

export default function ProjectAttachmentsTab({
  styles,
  formData,
  setFormData,
  addLink,
  removeLink,
  removeAttachment,
  onAddImagesPress,
  showPermissionModal,
  setShowPermissionModal,
  handleFilePick,
  handleSave,
  isSubmitting,
  isEditMode,
  setActiveTab,
}) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Project Links</Text>
      {formData.links.length === 0 ? <Text style={styles.noDataText}>No links added</Text> : (
        <View style={styles.linksContainer}>
          {formData.links.map((link, i) => (
            <View key={link.id} style={styles.linkItem}>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkUrl}>{link.url}</Text>
              </View>
              <TouchableOpacity onPress={() => removeLink(i)}><X size={16} color={theme.colors.meeting} /></TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.linkInputRow}>
        <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="URL" value={formData.linkUrl} onChangeText={v => setFormData(prev => ({ ...prev, linkUrl: v }))} />
        <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="Title" value={formData.linkTitle} onChangeText={v => setFormData(prev => ({ ...prev, linkTitle: v }))} />
      </View>
      <TouchableOpacity style={[styles.addLinkButton, { backgroundColor: theme.colors.project }]} onPress={addLink}>
        <Text style={styles.addLinkText}>Add Link</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Attachments</Text>
      {formData.attachments.length === 0 ? (
        <Text style={styles.noDataText}>No images</Text>
      ) : (
        <View style={styles.attachmentsContainer}>
          {formData.attachments.map((f, i) => (
            <View key={f.id} style={styles.attachmentItem}>
              <View style={styles.attachmentInfo}>
                <Paperclip size={16} color={theme.colors.textSecondary} />
                <Image source={{ uri: f.uri }} style={styles.attachmentThumbnail} resizeMode="cover" />
                <Text style={styles.attachmentName}>{f.name}</Text>
              </View>
              <TouchableOpacity onPress={() => removeAttachment(i)}>
                <X size={16} color={theme.colors.meeting} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity style={[styles.addFilesButton, { backgroundColor: theme.colors.primary }]} onPress={onAddImagesPress}>
        <Paperclip size={16} color={theme.colors.background} />
        <Text style={styles.addFilesText}>Add Images</Text>
      </TouchableOpacity>

      <Modal visible={showPermissionModal} transparent onRequestClose={() => setShowPermissionModal(false)} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowPermissionModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.colorPickerContainer, { paddingBottom: 12 }]}>
                <Text style={styles.modalTitle}>Allow access to your photos</Text>
                <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
                  We need permission to access your photo library so you can attach images to this project.
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                  <TouchableOpacity onPress={() => setShowPermissionModal(false)} style={[styles.cancelButton, { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.colors.border, marginRight: 8 }]}>
                    <Text style={[styles.buttonText, { color: theme.colors.text }]}>Not now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowPermissionModal(false); setTimeout(handleFilePick, 100); }} style={[styles.nextButton, { paddingHorizontal: 16, paddingVertical: 10 }]}>
                    <Text style={styles.buttonText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveTab("team")}>
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Back to Team</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.createButton, isSubmitting && styles.disabledButton]} onPress={handleSave}>
          <Text style={styles.buttonText}>{isEditMode ? "Update" : "Create"} Project</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
