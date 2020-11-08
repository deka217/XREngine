import Editor from "../Editor";
import ElementsSource from "../ui/assets/sources/ElementsSource";
import MyAssetsSource from "../ui/assets/sources/MyAssetsSource";
import AmbientLightNodeEditor from "../ui/properties/AmbientLightNodeEditor";
import AudioNodeEditor from "../ui/properties/AudioNodeEditor";
import BoxColliderNodeEditor from "../ui/properties/BoxColliderNodeEditor";
import DirectionalLightNodeEditor from "../ui/properties/DirectionalLightNodeEditor";
import GroundPlaneNodeEditor from "../ui/properties/GroundPlaneNodeEditor";
import GroupNodeEditor from "../ui/properties/GroupNodeEditor";
import HemisphereLightNodeEditor from "../ui/properties/HemisphereLightNodeEditor";
import ImageNodeEditor from "../ui/properties/ImageNodeEditor";
import LinkNodeEditor from "../ui/properties/LinkNodeEditor";
import ModelNodeEditor from "../ui/properties/ModelNodeEditor";
import PointLightNodeEditor from "../ui/properties/PointLightNodeEditor";
import SceneNodeEditor from "../ui/properties/SceneNodeEditor";
import ScenePreviewCameraNodeEditor from "../ui/properties/ScenePreviewCameraNodeEditor";
import SkyboxNodeEditor from "../ui/properties/SkyboxNodeEditor";
import SpawnPointNodeEditor from "../ui/properties/SpawnPointNodeEditor";
import SpotLightNodeEditor from "../ui/properties/SpotLightNodeEditor";
import TriggerVolumeNodeEditor from "../ui/properties/TriggerVolumeNodeEditor";
import VideoNodeEditor from "../ui/properties/VideoNodeEditor";
import AmbientLightNode from "./AmbientLightNode";
import AudioNode from "./AudioNode";
import BoxColliderNode from "./BoxColliderNode";
import DirectionalLightNode from "./DirectionalLightNode";
import GroundPlaneNode from "./GroundPlaneNode";
import GroupNode from "./GroupNode";
import HemisphereLightNode from "./HemisphereLightNode";
import FloorPlanNode from "./FloorPlanNode";
import FloorPlanNodeEditor from "../ui/properties/FloorPlanNodeEditor";
import ImageNode from "./ImageNode";
import LinkNode from "./LinkNode";
import ModelNode from "./ModelNode";
import PointLightNode from "./PointLightNode";
import SceneNode from "./SceneNode";
import ScenePreviewCameraNode from "./ScenePreviewCameraNode";
import SkyboxNode from "./SkyboxNode";
import SpawnPointNode from "./SpawnPointNode";
import SpotLightNode from "./SpotLightNode";
import TriggerVolumeNode from "./TriggerVolumeNode";
import VideoNode from "./VideoNode";
import BingImagesSource from "../ui/assets/sources/BingImagesSource";
import BingVideosSource from "../ui/assets/sources/BingVideosSource";
import PolySource from "../ui/assets/sources/PolySource";
import SketchfabSource from "../ui/assets/sources/SketchfabSource";
import TenorSource from "../ui/assets/sources/TenorSource";

export function createEditor(api, settings) {
  const editor = new Editor(api, settings);

  editor.registerNode(SceneNode, SceneNodeEditor);
  editor.registerNode(GroupNode, GroupNodeEditor);
  editor.registerNode(ModelNode, ModelNodeEditor);
  editor.registerNode(GroundPlaneNode, GroundPlaneNodeEditor);
  editor.registerNode(BoxColliderNode, BoxColliderNodeEditor);
  editor.registerNode(AmbientLightNode, AmbientLightNodeEditor);
  editor.registerNode(DirectionalLightNode, DirectionalLightNodeEditor);
  editor.registerNode(HemisphereLightNode, HemisphereLightNodeEditor);
  editor.registerNode(SpotLightNode, SpotLightNodeEditor);
  editor.registerNode(PointLightNode, PointLightNodeEditor);
  editor.registerNode(SpawnPointNode, SpawnPointNodeEditor);
  editor.registerNode(SkyboxNode, SkyboxNodeEditor);
  editor.registerNode(FloorPlanNode, FloorPlanNodeEditor);
  editor.registerNode(ImageNode, ImageNodeEditor);
  editor.registerNode(VideoNode, VideoNodeEditor);
  editor.registerNode(AudioNode, AudioNodeEditor);
  editor.registerNode(TriggerVolumeNode, TriggerVolumeNodeEditor);
  editor.registerNode(LinkNode, LinkNodeEditor);
  editor.registerNode(ScenePreviewCameraNode, ScenePreviewCameraNodeEditor);
  editor.registerSource(new ElementsSource(editor));
  editor.registerSource(new MyAssetsSource(editor));
  editor.registerSource(new SketchfabSource(api));
  editor.registerSource(new PolySource(api));
  editor.registerSource(new BingImagesSource(api));
  editor.registerSource(new BingVideosSource(api));
  editor.registerSource(new TenorSource(api));

  return editor;
}
