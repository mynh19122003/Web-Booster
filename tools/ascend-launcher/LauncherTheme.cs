using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace AscendLauncher {
internal static class LauncherTheme {
 internal static readonly Color Background=Color.FromArgb(11,13,18), Surface=Color.FromArgb(17,20,27), Gold=Color.FromArgb(224,160,74), Text=Color.FromArgb(245,247,250), Muted=Color.FromArgb(183,192,204), Border=Color.FromArgb(43,48,59);
 // Windows' local Segoe UI contains Vietnamese glyphs; no network/font install is needed.
 internal static Font Font(float pixels,FontStyle style=FontStyle.Regular){return new Font("Segoe UI",pixels,style,GraphicsUnit.Pixel);}
 internal static GraphicsPath Rounded(RectangleF bounds,float radius){var p=new GraphicsPath();float d=Math.Min(radius*2,Math.Min(bounds.Width,bounds.Height));if(d<=0)return p;p.AddArc(bounds.X,bounds.Y,d,d,180,90);p.AddArc(bounds.Right-d,bounds.Y,d,d,270,90);p.AddArc(bounds.Right-d,bounds.Bottom-d,d,d,0,90);p.AddArc(bounds.X,bounds.Bottom-d,d,d,90,90);p.CloseFigure();return p;}
}
internal sealed class LauncherButton:Button {
 internal bool Emphasized;bool hovered,pressed;
 internal LauncherButton(){SetStyle(ControlStyles.UserPaint|ControlStyles.AllPaintingInWmPaint|ControlStyles.OptimizedDoubleBuffer,true);FlatStyle=FlatStyle.Flat;FlatAppearance.BorderSize=0;Cursor=Cursors.Hand;Font=LauncherTheme.Font(16,FontStyle.Bold);BackColor=LauncherTheme.Surface;ForeColor=LauncherTheme.Text;}
 protected override void OnMouseEnter(EventArgs e){hovered=true;Invalidate();base.OnMouseEnter(e);}protected override void OnMouseLeave(EventArgs e){hovered=false;pressed=false;Invalidate();base.OnMouseLeave(e);}protected override void OnMouseDown(MouseEventArgs e){pressed=true;Invalidate();base.OnMouseDown(e);}protected override void OnMouseUp(MouseEventArgs e){pressed=false;Invalidate();base.OnMouseUp(e);}protected override void OnGotFocus(EventArgs e){Invalidate();base.OnGotFocus(e);}protected override void OnLostFocus(EventArgs e){Invalidate();base.OnLostFocus(e);}
 protected override void OnPaint(PaintEventArgs e){e.Graphics.Clear(BackColor);e.Graphics.SmoothingMode=SmoothingMode.AntiAlias;var fill=Emphasized?(pressed?Color.FromArgb(200,138,52):hovered?Color.FromArgb(235,177,96):LauncherTheme.Gold):(hovered?Color.FromArgb(35,40,51):Color.FromArgb(24,28,37));using(var path=LauncherTheme.Rounded(new RectangleF(1,1,Width-3,Height-3),10))using(var brush=new SolidBrush(fill))using(var pen=new Pen(Emphasized?LauncherTheme.Gold:LauncherTheme.Border)){e.Graphics.FillPath(brush,path);e.Graphics.DrawPath(pen,path);}TextRenderer.DrawText(e.Graphics,Text,Font,ClientRectangle,!Enabled?Color.FromArgb(117,126,140):Emphasized?LauncherTheme.Background:ForeColor,TextFormatFlags.HorizontalCenter|TextFormatFlags.VerticalCenter|TextFormatFlags.SingleLine|TextFormatFlags.NoPrefix);if(Focused&&ShowFocusCues)ControlPaint.DrawFocusRectangle(e.Graphics,new Rectangle(6,6,Width-12,Height-12),Emphasized?LauncherTheme.Background:LauncherTheme.Gold,fill);}
}
}
