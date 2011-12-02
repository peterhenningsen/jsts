/**
 * Snaps the vertices and segments of a {@link Geometry}
 * to another Geometry's vertices.
 * A snap distance tolerance is used to control where snapping is performed.
 * Snapping one geometry to another can improve
 * robustness for overlay operations by eliminating
 * nearly-coincident edges
 * (which cause problems during noding and intersection calculation).
 * Too much snapping can result in invalid topology
 * beging created, so the number and location of snapped vertices
 * is decided using heuristics to determine when it
 * is safe to snap.
 * This can result in some potential snaps being omitted, however.
 *
 * @author Martin Davis
 * @version 1.7
 *
 * @requires jsts/geom/util/GeometryTransformer.js
 */

/**
 * @constructor
 */
jsts.operation.overlay.snap.GeometrySnapper = function(srcGeom) {
  this.srcGeom = srcGeom;
};
jsts.operation.overlay.snap.GeometrySnapper.SNAP_PRECISION_FACTOR = 1e-9;

/**
 * Snaps two geometries together with a given tolerance.
 *
 * @param {jsts.geom.Geometry}
 *          g0 the geometry to snap.
 * @param {jsts.geom.Geometry}
 *          g1 the geometry to snap.
 * @param {Number}
 *          snapTolerance the tolerance to use.
 * @return {Array{jsts.geom.Geometry}} the snapped geometries.
 */
jsts.operation.overlay.snap.GeometrySnapper.snap = function(g0, g1,
    snapTolerance) {
  var snapGeom = [];

  var snapper0 = new jsts.operation.overlay.snap.GeometrySnapper(g0);

  snapGeom[0] = snapper0.snapTo(g1, snapTolerance);

  /**
   * Snap the second geometry to the snapped first geometry (this strategy
   * minimizes the number of possible different points in the result)
   */
  var snapper1 = new jsts.operation.overlay.snap.GeometrySnapper(g1);
  snapGeom[1] = snapper1.snapTo(snapGeom[0], snapTolerance);

  return snapGeom;

};

/**
 * Snaps the vertices in the component {jsts.geom.LineString}s of the source
 * geometry to the vertices of the given snap geometry.
 *
 * @param {jsts.geom.Geometry}
 *          snapGeom a geometry to snap the source to.
 * @return {jsts.geom.Geometry} a new snapped Geometry.
 */
jsts.operation.overlay.snap.GeometrySnapper.prototype.snapTo = function(
    snapGeom, snapTolerance) {
  var snapPts = this.extractTargetCoordinates(snapGeom);

  var snapTrans = new jsts.operation.overlay.snap.SnapTransformer(
      snapTolerance, snapPts);

  return snapTrans.transform(this.srcGeom);
};

/**
 * Snaps the vertices in the component {@link LineString}s of the source
 * geometry to the vertices of the given snap geometry.
 *
 * @param {jsts.geom.Geometry}
 *          snapGeom a geometry to snap the source to.
 * @return {jsts.geom.Geometry} a new snapped Geometry.
 */
jsts.operation.overlay.snap.GeometrySnapper.prototype.snapToSelf = function(
    snapTolerance, cleanResult) {
  var snapPts = this.extractTargetCoordinates(this.srcGeom);

  var snapTrans = new jsts.operation.overlay.snap.GeometrySnapper.SnapTransformer(
      snapTolerance, snapPts, true);
  var snappedGeom = snapTrans.transform(this.srcGeom);
  var result = snappedGeom;
  if (cleanResult && result instanceof Polygonal) {
    // TODO: use better cleaning approach
    result = snappedGeom.buffer(0);
  }
  return result;
};

jsts.operation.overlay.snap.GeometrySnapper.prototype.extractTargetCoordinates = function(
    g) {
  // TODO: should do this more efficiently. Use CoordSeq filter to get points,
  // KDTree for uniqueness & queries
  var ptSet = new javascript.util.TreeSet();
  var pts = g.getCoordinates();
  for (var i = 0; i < pts.length; i++) {
    ptSet.add(pts[i]);
  }
  return ptSet.toArray();
};


/**
 * @constructor
 * @return {jsts.operation.overlay.snap.SnapTransformer}
 */
jsts.operation.overlay.snap.SnapTransformer = function() {
  if (arguments.length === 2) {
    this.snapTolerance = arguments[0];
    this.snapPts = arguments[1];
    this.isSelfSnap = false;
  } else {
    this.snapTolerance = arguments[0];
    this.snapPts = arguments[1];
    this.isSelfSnap = isSelfSnap;
  }

};

jsts.operation.overlay.snap.SnapTransformer.prototype = new jsts.geom.util.GeometryTransformer();

jsts.operation.overlay.snap.SnapTransformer.constructor = jsts.operation.overlay.snap.SnapTransformer;

jsts.operation.overlay.snap.SnapTransformer.prototype.transformCoordinates = function(
    coords, parent) {
  var newPts = this.snapLine(coords, this.snapPts);

  var coordseq = [];

  for (var i = 0; i < newPts.length - 1; i++) {
    coordseq.push(newPts[i]);
  }

  return coordseq;
};
jsts.operation.overlay.snap.SnapTransformer.prototype.snapLine = function(
    srcPts, snapPts) {
  var snapper = new jsts.operation.overlay.snap.LineStringSnapper(srcPts,
      this.snapTolerance);
  snapper.setAllowSnappingToSourceVertices(this.isSelfSnap);

  return snapper.snapTo(snapPts);
};
